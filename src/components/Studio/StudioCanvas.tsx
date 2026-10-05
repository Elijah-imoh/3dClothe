import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ColorItem } from '../../types/outfit';
import { buildRealisticAvatar, RealisticAvatarInstance } from './RealisticAvatar';

export type CameraPreset = 'full' | 'torso' | 'trousers' | 'shoes';

const UNSELECTED_GARMENT_HEX = '#f0ede6';

interface StudioCanvasProps {
  shirtColor: ColorItem | null;
  trousersColor: ColorItem | null;
  shoesColor: ColorItem | null;
  activeCategory?: string;
  externalPreset?: CameraPreset;
  onPresetChange?: (preset: CameraPreset) => void;
}

const PRESET_CONFIGS: Record<CameraPreset, { target: [number, number, number]; pos: [number, number, number] }> = {
  full: { target: [0, 0.95, 0], pos: [0, 1.15, 2.7] },
  torso: { target: [0, 1.32, 0], pos: [0, 1.35, 1.5] },
  trousers: { target: [0, 0.72, 0], pos: [0, 0.75, 1.7] },
  shoes: { target: [0, 0.18, 0], pos: [0, 0.38, 1.25] },
};

/**
 * Prepares clothing materials for independent color tinting while preserving
 * high-resolution fabric creases, normal maps, and surface shading.
 */
function prepareClothingMaterial(mesh: THREE.Mesh, initialHex: string): THREE.MeshStandardMaterial {
  const originalMat = mesh.material as THREE.MeshStandardMaterial;
  const mat = originalMat.clone();
  mesh.material = mat;

  if (mat.map && mat.map.image) {
    try {
      const img = mat.map.image as HTMLImageElement | ImageBitmap;
      const width = (img as { width?: number }).width || 1024;
      const height = (img as { height?: number }).height || 1024;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img as CanvasImageSource, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) {
          sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }
        const avg = sum / (d.length / 4) || 128;
        const target = 220; // clean high-luminance neutral base for true PBR color accuracy
        const mult = target / avg;
        for (let i = 0; i < d.length; i += 4) {
          const lum = Math.min(255, Math.max(0, Math.round((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * mult)));
          d[i] = lum;
          d[i + 1] = lum;
          d[i + 2] = lum;
        }
        ctx.putImageData(imgData, 0, 0);
        const canvasTex = new THREE.CanvasTexture(canvas);
        canvasTex.flipY = false;
        canvasTex.wrapS = mat.map.wrapS || THREE.RepeatWrapping;
        canvasTex.wrapT = mat.map.wrapT || THREE.RepeatWrapping;
        canvasTex.needsUpdate = true;
        mat.map = canvasTex;
      }
    } catch {
      // Graceful fallback if texture format restricts readback
    }
  }

  mat.color = new THREE.Color(initialHex);
  mat.needsUpdate = true;
  return mat;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  shirtColor,
  trousersColor,
  shoesColor,
  activeCategory,
  externalPreset,
  onPresetChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modelType, setModelType] = useState<'procedural' | 'custom-glb'>('procedural');
  const [customModelName, setCustomModelName] = useState<string>('');
  const [activePreset, setActivePreset] = useState<CameraPreset>(externalPreset || 'full');

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Clothing material references
  const shirtMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trousersMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const shoesMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Target colors for smooth lerp
  const targetColorsRef = useRef<{
    shirt: THREE.Color;
    trousers: THREE.Color;
    shoes: THREE.Color;
  }>({
    shirt: new THREE.Color(shirtColor ? shirtColor.hex : UNSELECTED_GARMENT_HEX),
    trousers: new THREE.Color(trousersColor ? trousersColor.hex : UNSELECTED_GARMENT_HEX),
    shoes: new THREE.Color(shoesColor ? shoesColor.hex : UNSELECTED_GARMENT_HEX),
  });

  // Camera lerp animation target
  const cameraLerpRef = useRef<{
    targetPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    isTransitioning: boolean;
  }>({
    targetPos: new THREE.Vector3(...PRESET_CONFIGS.full.pos),
    targetLookAt: new THREE.Vector3(...PRESET_CONFIGS.full.target),
    isTransitioning: false,
  });

  // Avatar root group reference
  const avatarGroupRef = useRef<THREE.Group | null>(null);

  // Sync target colors whenever props change
  useEffect(() => {
    targetColorsRef.current.shirt.set(shirtColor ? shirtColor.hex : UNSELECTED_GARMENT_HEX);
  }, [shirtColor]);

  useEffect(() => {
    targetColorsRef.current.trousers.set(trousersColor ? trousersColor.hex : UNSELECTED_GARMENT_HEX);
  }, [trousersColor]);

  useEffect(() => {
    targetColorsRef.current.shoes.set(shoesColor ? shoesColor.hex : UNSELECTED_GARMENT_HEX);
  }, [shoesColor]);

  // Adjust camera preset when user selects different category
  useEffect(() => {
    if (activeCategory === 'shirt') setCameraPreset('torso');
    else if (activeCategory === 'trousers') setCameraPreset('trousers');
    else if (activeCategory === 'shoes') setCameraPreset('shoes');
  }, [activeCategory]);

  useEffect(() => {
    if (externalPreset && externalPreset !== activePreset) {
      setCameraPreset(externalPreset);
    }
  }, [externalPreset]);

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    onPresetChange?.(preset);
    const config = PRESET_CONFIGS[preset];
    if (controlsRef.current && cameraRef.current) {
      cameraLerpRef.current.targetPos.set(...config.pos);
      cameraLerpRef.current.targetLookAt.set(...config.target);
      cameraLerpRef.current.isTransitioning = true;
    }
  }, [onPresetChange]);

  /**
   * Initialize Three.js scene, lighting, camera and controls
   */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 700;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Studio background - pristine light gallery feel matching screenshot
    scene.background = new THREE.Color(0xfafafa);
    scene.fog = new THREE.Fog(0xfafafa, 6, 15);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 20);
    camera.position.set(...PRESET_CONFIGS.full.pos);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(...PRESET_CONFIGS.full.target);
    controls.minDistance = 1.0;
    controls.maxDistance = 4.2;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent flipping beneath floor
    controlsRef.current = controls;

    // 5. Studio Lighting calibrated for realistic human model & fabric response
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Key Light (Warm directional for natural skin tone & facial depth)
    const keyLight = new THREE.DirectionalLight(0xfffaee, 1.15);
    keyLight.position.set(2.2, 3.2, 2.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 8;
    scene.add(keyLight);

    // Fill Light (Cool directional for soft natural shadows)
    const fillLight = new THREE.DirectionalLight(0xf2f6ff, 0.65);
    fillLight.position.set(-2.2, 2.0, 2.0);
    scene.add(fillLight);

    // Rim / Hair / Silhouette Backlight
    const rimLight = new THREE.DirectionalLight(0xfff7ed, 0.75);
    rimLight.position.set(0.2, 2.8, -2.4);
    scene.add(rimLight);

    // Subtle Ground Bounce Light
    const groundBounce = new THREE.HemisphereLight(0xffffff, 0xe5e7eb, 0.5);
    scene.add(groundBounce);

    // 6. Load genuine high-quality realistic human 3D avatar asset
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/assets/avatar/realistic-male.glb',
      (gltf) => {
        const glbModel = gltf.scene;
        avatarGroupRef.current = glbModel;
        glbModel.position.set(0, 0, 0);

        // Map separate clothing meshes & materials
        glbModel.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const name = mesh.name.toLowerCase();
            const matName = ((mesh.material as THREE.Material)?.name || '').toLowerCase();

            if (name.includes('top') || name.includes('shirt') || matName.includes('top') || matName.includes('shirt')) {
              // SHIRT (Wolf3D_Outfit_Top)
              const mat = prepareClothingMaterial(mesh, shirtColor ? shirtColor.hex : UNSELECTED_GARMENT_HEX);
              shirtMaterialRef.current = mat;
            } else if (name.includes('bottom') || name.includes('trouser') || name.includes('pant') || matName.includes('bottom')) {
              // TROUSERS (Wolf3D_Outfit_Bottom)
              const mat = prepareClothingMaterial(mesh, trousersColor ? trousersColor.hex : UNSELECTED_GARMENT_HEX);
              trousersMaterialRef.current = mat;
            } else if (name.includes('foot') || name.includes('shoe') || matName.includes('foot') || matName.includes('shoe')) {
              // SHOES (Wolf3D_Outfit_Footwear)
              const mat = prepareClothingMaterial(mesh, shoesColor ? shoesColor.hex : UNSELECTED_GARMENT_HEX);
              shoesMaterialRef.current = mat;
            } else if (name.includes('hair') || matName.includes('hair')) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.52;
            } else if (name.includes('head') || name.includes('body') || matName.includes('skin')) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.58;
            }
          }
        });

        // Add soft realistic gallery shadow on floor beneath shoes
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sCtx = shadowCanvas.getContext('2d');
        if (sCtx) {
          const gradient = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
          gradient.addColorStop(0, 'rgba(0,0,0,0.22)');
          gradient.addColorStop(0.5, 'rgba(0,0,0,0.07)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          sCtx.fillStyle = gradient;
          sCtx.fillRect(0, 0, 256, 256);
          const shadowTex = new THREE.CanvasTexture(shadowCanvas);
          const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
          const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
          });
          const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
          shadowPlane.rotation.x = -Math.PI / 2;
          shadowPlane.position.set(0, 0.002, 0);
          glbModel.add(shadowPlane);
        }

        scene.add(glbModel);
        setModelType('custom-glb');
        setCustomModelName('realistic-male.glb');
        setIsLoading(false);
      },
      undefined,
      () => {
        // Fallback if needed
        const realisticAvatar = buildRealisticAvatar(shirtColor, trousersColor, shoesColor);
        shirtMaterialRef.current = realisticAvatar.shirtMaterial;
        trousersMaterialRef.current = realisticAvatar.trousersMaterial;
        shoesMaterialRef.current = realisticAvatar.shoesMaterial;
        avatarGroupRef.current = realisticAvatar.group;
        scene.add(realisticAvatar.group);
        setIsLoading(false);
      }
    );

    // 7. Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth color lerp
      if (shirtMaterialRef.current) {
        shirtMaterialRef.current.color.lerp(targetColorsRef.current.shirt, 0.12);
      }
      if (trousersMaterialRef.current) {
        trousersMaterialRef.current.color.lerp(targetColorsRef.current.trousers, 0.12);
      }
      if (shoesMaterialRef.current) {
        shoesMaterialRef.current.color.lerp(targetColorsRef.current.shoes, 0.12);
      }

      // Smooth camera transition between presets
      if (cameraLerpRef.current.isTransitioning) {
        camera.position.lerp(cameraLerpRef.current.targetPos, 0.08);
        controls.target.lerp(cameraLerpRef.current.targetLookAt, 0.08);

        if (
          camera.position.distanceTo(cameraLerpRef.current.targetPos) < 0.01 &&
          controls.target.distanceTo(cameraLerpRef.current.targetLookAt) < 0.01
        ) {
          cameraLerpRef.current.isTransitioning = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rotate avatar manually
  const rotateAvatar = (deltaAngle: number) => {
    if (controlsRef.current) {
      controlsRef.current.rotateLeft(deltaAngle);
      controlsRef.current.update();
    }
  };

  // Tilt camera manually
  const tiltCamera = (deltaAngle: number) => {
    if (controlsRef.current) {
      controlsRef.current.rotateUp(deltaAngle);
      controlsRef.current.update();
    }
  };

  // Zoom manually
  const zoomCamera = (factor: number) => {
    if (cameraRef.current && controlsRef.current) {
      const newPos = cameraRef.current.position.clone().sub(controlsRef.current.target).multiplyScalar(factor).add(controlsRef.current.target);
      if (newPos.distanceTo(controlsRef.current.target) >= 1.0 && newPos.distanceTo(controlsRef.current.target) <= 4.2) {
        cameraRef.current.position.copy(newPos);
      }
    }
  };

  // Handle user uploading their own GLB avatar file directly in browser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();
      loader.parse(
        contents,
        '',
        (gltf) => {
          if (avatarGroupRef.current && sceneRef.current) {
            sceneRef.current.remove(avatarGroupRef.current);
          }
          const glbModel = gltf.scene;
          avatarGroupRef.current = glbModel;
          glbModel.position.set(0, 0, 0);

          glbModel.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const name = mesh.name.toLowerCase();
              const matName = ((mesh.material as THREE.Material)?.name || '').toLowerCase();

              if (name.includes('shirt') || name.includes('top') || matName.includes('top') || matName.includes('shirt')) {
                shirtMaterialRef.current = prepareClothingMaterial(mesh, shirtColor ? shirtColor.hex : UNSELECTED_GARMENT_HEX);
              } else if (name.includes('trouser') || name.includes('pant') || name.includes('bottom') || matName.includes('bottom')) {
                trousersMaterialRef.current = prepareClothingMaterial(mesh, trousersColor ? trousersColor.hex : UNSELECTED_GARMENT_HEX);
              } else if (name.includes('shoe') || name.includes('foot') || matName.includes('foot') || matName.includes('shoe')) {
                shoesMaterialRef.current = prepareClothingMaterial(mesh, shoesColor ? shoesColor.hex : UNSELECTED_GARMENT_HEX);
              }
            }
          });

          sceneRef.current?.add(glbModel);
          setModelType('custom-glb');
          setCustomModelName(file.name);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-full flex flex-col bg-[#fafafa] select-none overflow-hidden">
      {/* 3D Canvas Mounting Area */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#fafafa]/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-zinc-600 font-mono text-xs">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mb-3" />
          <span className="tracking-widest uppercase text-zinc-500">[ LOADING 3D ATELIER… ]</span>
        </div>
      )}

      {/* Top-Left: [ ACTIVE CATEGORY ] from screenshot */}
      <div className="absolute top-6 left-6 sm:left-8 pointer-events-none z-10 font-mono text-xs text-[#111111] uppercase tracking-wider">
        [ {activeCategory ? activeCategory.toUpperCase() : 'SHIRT'} ]
      </div>

      {/* Top-Right: [ SELECT A COLOUR ] from screenshot */}
      <div className="absolute top-6 right-6 sm:right-8 pointer-events-auto z-10 flex items-center gap-3 font-mono text-xs text-[#111111] uppercase tracking-wider">
        <span>[ SELECT A COLOUR ]</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Load external .glb avatar model"
          className="text-zinc-400 hover:text-black text-[11px] cursor-pointer"
        >
          [ GLB ]
        </button>
      </div>

      {/* Bottom Presets (Subtle) */}
      <div className="absolute bottom-6 left-6 sm:left-8 pointer-events-auto z-10 hidden sm:flex items-center gap-3 font-mono text-[11px] text-zinc-400">
        {(['full', 'torso', 'trousers', 'shoes'] as CameraPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            className={`cursor-pointer transition-colors ${
              activePreset === preset ? 'text-black font-semibold underline' : 'hover:text-black'
            }`}
          >
            {preset.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bottom Center: DRAG TO ROTATE · SCROLL TO ZOOM from screenshot */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <span className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase font-medium">
          DRAG TO ROTATE · SCROLL TO ZOOM
        </span>
      </div>
    </div>
  );
};
