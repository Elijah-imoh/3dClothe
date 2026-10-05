import * as THREE from 'three';
import { ColorItem } from '../../types/outfit';

export interface RealisticAvatarInstance {
  group: THREE.Group;
  updateShirtColor: (hex: string) => void;
  updateTrousersColor: (hex: string) => void;
  updateShoesColor: (hex: string) => void;
  shirtMaterial: THREE.MeshStandardMaterial;
  trousersMaterial: THREE.MeshStandardMaterial;
  shoesMaterial: THREE.MeshStandardMaterial;
}

const UNSELECTED_HEX = '#f0ede6';

/**
 * Procedural micro-texture generator for realistic cloth weaves and leather grain.
 */
function createProceduralTexture(type: 'cotton' | 'twill' | 'leather'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (type === 'cotton') {
    // Oxford cloth micro-weave
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#909090';
    for (let x = 0; x < 256; x += 4) {
      for (let y = 0; y < 256; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  } else if (type === 'twill') {
    // Diagonal twill ribs
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#929292';
    ctx.lineWidth = 1.5;
    for (let i = -256; i < 512; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }
  } else {
    // Rich calfskin leather grain
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const r = 1.5 + Math.random() * 2.5;
      const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.18)');
      grad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const repeat = type === 'leather' ? 6 : 12;
  texture.repeat.set(repeat, repeat);
  return texture;
}

/**
 * Builds an anatomically sculpted realistic adult male human head.
 */
function createSculptedHead(skinMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.68, 0);

  // 1. Base Anatomical Cranium & Face
  const headGeo = new THREE.SphereGeometry(0.108, 48, 40);
  const pos = headGeo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Anatomical proportions
    // Slightly taper temples / side of head
    if (v.y > 0.02) {
      v.x *= 0.92;
      v.z *= 1.05; // Slightly longer cranium front-to-back
    }

    // Jawline & Chin sculpting (y < 0)
    if (v.y < 0.0) {
      const yFactor = Math.abs(v.y);
      // Jaw taper
      v.x *= Math.max(0.72, 1.0 - yFactor * 2.2);

      // Defined square-rounded masculine chin
      if (v.y < -0.065 && v.z > 0.02) {
        const chinDist = Math.hypot(v.x, v.y + 0.085);
        if (chinDist < 0.04) {
          v.z += 0.016 * (1 - chinDist / 0.04);
        }
      }

      // Mandible angle (jaw contour)
      if (v.y > -0.065 && v.y < -0.02 && Math.abs(v.x) > 0.055 && v.z < 0.02) {
        v.x += Math.sign(v.x) * 0.006;
      }
    }

    // Eye Sockets (y ≈ 0.015, |x| ≈ 0.038, z > 0.06)
    if (v.z > 0.05 && v.y > 0.005 && v.y < 0.032) {
      const eyeX = Math.abs(v.x) - 0.038;
      const eyeY = v.y - 0.018;
      const socketDist = Math.hypot(eyeX, eyeY);
      if (socketDist < 0.025) {
        v.z -= 0.014 * (1 - socketDist / 0.025);
      }
    }

    // Brow Ridge (y ≈ 0.036, z > 0.06)
    if (v.z > 0.05 && v.y > 0.028 && v.y < 0.048 && Math.abs(v.x) < 0.06) {
      v.z += 0.008;
    }

    // Nose Bridge & Tip (y between -0.03 and 0.03, |x| < 0.024, z > 0.05)
    if (Math.abs(v.x) < 0.024 && v.y > -0.035 && v.y < 0.032 && v.z > 0.05) {
      const centerFactor = 1 - Math.abs(v.x) / 0.024;
      if (v.y > -0.018) {
        // Bridge
        v.z += 0.018 * centerFactor;
      } else {
        // Nose tip & nostrils
        v.z += 0.024 * centerFactor;
        if (Math.abs(v.x) > 0.011) {
          // Nostril wing protrusion
          v.z -= 0.004;
        }
      }
    }

    // Lips & Mouth (y between -0.068 and -0.04, |x| < 0.034, z > 0.06)
    if (Math.abs(v.x) < 0.034 && v.y > -0.068 && v.y < -0.038 && v.z > 0.05) {
      const mouthCenter = 1 - Math.abs(v.x) / 0.034;
      if (v.y > -0.052) {
        // Upper lip
        v.z += 0.009 * mouthCenter;
      } else if (v.y < -0.058) {
        // Lower lip
        v.z += 0.011 * mouthCenter;
      } else {
        // Mouth seam
        v.z += 0.003;
      }
    }

    // Cheekbones (Zygomatic arch)
    if (v.y > -0.01 && v.y < 0.025 && Math.abs(v.x) > 0.045 && Math.abs(v.x) < 0.085 && v.z > 0.02) {
      v.x += Math.sign(v.x) * 0.006;
      v.z += 0.005;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  headGeo.computeVertexNormals();
  const headMesh = new THREE.Mesh(headGeo, skinMaterial);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // 2. Realistic 3D Eyes
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f3,
    roughness: 0.15,
    metalness: 0.05,
  });

  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x3d2719, // Deep warm brown hazel
    roughness: 0.2,
    metalness: 0.1,
  });

  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    transmission: 0.6,
  });

  const createRealisticEye = (isLeft: boolean) => {
    const eye = new THREE.Group();
    eye.position.set(isLeft ? 0.038 : -0.038, 0.018, 0.082);

    // Eyeball
    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 20, 16), eyeWhiteMat);
    eye.add(eyeball);

    // Iris
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0068, 20), irisMat);
    iris.position.set(0, 0, 0.0133);
    eye.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 16), pupilMat);
    pupil.position.set(0, 0, 0.0135);
    eye.add(pupil);

    // Cornea Dome (High Specular Shine)
    const cornea = new THREE.Mesh(
      new THREE.SphereGeometry(0.007, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      corneaMat
    );
    cornea.position.set(0, 0, 0.008);
    cornea.rotation.x = Math.PI / 2;
    eye.add(cornea);

    // Upper Eyelid Fold
    const upperLidGeo = new THREE.TorusGeometry(0.0135, 0.0025, 8, 16, Math.PI * 0.9);
    upperLidGeo.rotateZ(Math.PI * 0.05);
    const upperLid = new THREE.Mesh(upperLidGeo, skinMaterial);
    upperLid.position.set(0, 0.005, 0.007);
    eye.add(upperLid);

    return eye;
  };

  headGroup.add(createRealisticEye(true));
  headGroup.add(createRealisticEye(false));

  // 3. Groomed Masculine Eyebrows
  const browMat = new THREE.MeshStandardMaterial({
    color: 0x221811,
    roughness: 0.8,
  });

  const createEyebrow = (isLeft: boolean) => {
    const browGeo = new THREE.BoxGeometry(0.036, 0.006, 0.005);
    browGeo.rotateZ(isLeft ? -0.1 : 0.1);
    const brow = new THREE.Mesh(browGeo, browMat);
    brow.position.set(isLeft ? 0.038 : -0.038, 0.038, 0.096);
    return brow;
  };
  headGroup.add(createEyebrow(true));
  headGroup.add(createEyebrow(false));

  // 4. Anatomical Ears
  const createEar = (isLeft: boolean) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(isLeft ? 0.098 : -0.098, 0.01, 0.002);
    earGroup.rotation.y = isLeft ? 0.25 : -0.25;

    // Outer Helix
    const helixGeo = new THREE.TorusGeometry(0.018, 0.004, 10, 18, Math.PI * 1.3);
    helixGeo.rotateZ(isLeft ? Math.PI * 0.4 : -Math.PI * 0.4);
    const helix = new THREE.Mesh(helixGeo, skinMaterial);
    earGroup.add(helix);

    // Ear Lobule & Concha
    const lobeGeo = new THREE.SphereGeometry(0.012, 12, 10);
    lobeGeo.scale(0.5, 1.2, 0.6);
    const lobe = new THREE.Mesh(lobeGeo, skinMaterial);
    lobe.position.set(0, -0.015, 0);
    earGroup.add(lobe);

    return earGroup;
  };
  headGroup.add(createEar(true));
  headGroup.add(createEar(false));

  // 5. Realistic Textured Hair (Matching the Handsome Reference Model)
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x201712, // Dark espresso brown
    roughness: 0.5,
    metalness: 0.06,
  });

  const hairGroup = new THREE.Group();

  // Top Volume Quiff / Pompadour Mass
  const hairBaseGeo = new THREE.SphereGeometry(0.108, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
  hairBaseGeo.scale(1.02, 1.15, 1.12);
  const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
  hairBase.position.set(0, 0.03, -0.005);
  hairBase.castShadow = true;
  hairGroup.add(hairBase);

  // Front Textured Swept-Back Wave Strands
  const waveGeo = new THREE.TorusGeometry(0.06, 0.022, 12, 24, Math.PI * 0.85);
  waveGeo.rotateX(Math.PI * 0.4);
  const frontWave = new THREE.Mesh(waveGeo, hairMat);
  frontWave.position.set(0, 0.11, 0.035);
  frontWave.castShadow = true;
  hairGroup.add(frontWave);

  // Layered Locks for realistic hair depth
  for (let i = -2; i <= 2; i++) {
    const lockGeo = new THREE.CylinderGeometry(0.014, 0.008, 0.09, 10);
    lockGeo.rotateX(Math.PI * 0.35);
    lockGeo.rotateZ(i * 0.12);
    const lock = new THREE.Mesh(lockGeo, hairMat);
    lock.position.set(i * 0.024, 0.105, 0.04 - Math.abs(i) * 0.008);
    lock.castShadow = true;
    hairGroup.add(lock);
  }

  // Tapered Sideburns
  const sideburnGeo = new THREE.BoxGeometry(0.012, 0.045, 0.02);
  const leftSideburn = new THREE.Mesh(sideburnGeo, hairMat);
  leftSideburn.position.set(0.096, 0.02, 0.025);
  hairGroup.add(leftSideburn);

  const rightSideburn = new THREE.Mesh(sideburnGeo, hairMat);
  rightSideburn.position.set(-0.096, 0.02, 0.025);
  hairGroup.add(rightSideburn);

  // Clean Tapered Neckline Back
  const backNapeGeo = new THREE.CylinderGeometry(0.075, 0.068, 0.06, 16);
  backNapeGeo.scale(1.1, 1, 0.8);
  const backNape = new THREE.Mesh(backNapeGeo, hairMat);
  backNape.position.set(0, -0.04, -0.055);
  hairGroup.add(backNape);

  headGroup.add(hairGroup);

  // 6. Anatomical Neck & Throat
  const neckGeo = new THREE.CylinderGeometry(0.062, 0.076, 0.18, 24);
  const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
  neckMesh.position.set(0, -0.13, 0);
  neckMesh.castShadow = true;
  headGroup.add(neckMesh);

  // Subtle Adam's Apple protrusion
  const adamsAppleGeo = new THREE.SphereGeometry(0.009, 12, 8);
  adamsAppleGeo.scale(1, 1.4, 1.6);
  const adamsApple = new THREE.Mesh(adamsAppleGeo, skinMaterial);
  adamsApple.position.set(0, -0.11, 0.066);
  headGroup.add(adamsApple);

  return headGroup;
}

/**
 * Builds realistic articulated human hands with 5 individual fingers.
 */
function createAnatomicalHand(
  isLeft: boolean,
  skinMaterial: THREE.MeshStandardMaterial
): THREE.Group {
  const handGroup = new THREE.Group();

  // Natural relaxed hand posture hanging beside trousers
  handGroup.rotation.z = isLeft ? -0.08 : 0.08;
  handGroup.rotation.y = isLeft ? -0.2 : 0.2; // Palms facing gently toward thigh

  // 1. Palm with thenar arch
  const palmGeo = new THREE.BoxGeometry(0.048, 0.078, 0.024);
  const palm = new THREE.Mesh(palmGeo, skinMaterial);
  palm.position.set(0, -0.04, 0);
  palm.castShadow = true;
  handGroup.add(palm);

  // Muscular Thenar Pad (Base of thumb)
  const thenarGeo = new THREE.SphereGeometry(0.015, 12, 8);
  thenarGeo.scale(1, 1.5, 0.9);
  const thenar = new THREE.Mesh(thenarGeo, skinMaterial);
  thenar.position.set(isLeft ? -0.016 : 0.016, -0.032, 0.006);
  handGroup.add(thenar);

  // 2. Thumb (Opposable angle)
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(isLeft ? -0.022 : 0.022, -0.028, 0.008);
  thumbGroup.rotation.z = isLeft ? 0.35 : -0.35;
  thumbGroup.rotation.x = 0.2;

  const thumbPhalanx1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0075, 0.007, 0.024, 10),
    skinMaterial
  );
  thumbPhalanx1.position.y = -0.012;
  thumbPhalanx1.castShadow = true;
  thumbGroup.add(thumbPhalanx1);

  const thumbPhalanx2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0068, 0.0055, 0.02, 10),
    skinMaterial
  );
  thumbPhalanx2.position.set(0, -0.03, 0.003);
  thumbPhalanx2.rotation.x = -0.15;
  thumbPhalanx2.castShadow = true;
  thumbGroup.add(thumbPhalanx2);

  handGroup.add(thumbGroup);

  // 3. Four Articulated Fingers (Index, Middle, Ring, Pinky)
  const fingerData = [
    { name: 'index', x: isLeft ? -0.016 : 0.016, length: 0.052, curl: 0.15 },
    { name: 'middle', x: isLeft ? -0.005 : 0.005, length: 0.058, curl: 0.18 },
    { name: 'ring', x: isLeft ? 0.006 : -0.006, length: 0.054, curl: 0.22 },
    { name: 'pinky', x: isLeft ? 0.017 : -0.017, length: 0.044, curl: 0.26 },
  ];

  fingerData.forEach((f) => {
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(f.x, -0.078, 0);

    // Segment 1 (Proximal)
    const seg1Len = f.length * 0.45;
    const seg1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.0055, seg1Len, 8),
      skinMaterial
    );
    seg1.position.y = -seg1Len / 2;
    seg1.rotation.x = f.curl;
    seg1.castShadow = true;
    fingerGroup.add(seg1);

    // Knuckle
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 8, 8), skinMaterial);
    knuckle.position.y = -seg1Len;
    fingerGroup.add(knuckle);

    // Segment 2 & 3 (Intermediate & Distal curved inward)
    const seg2Len = f.length * 0.55;
    const seg2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0052, 0.0042, seg2Len, 8),
      skinMaterial
    );
    seg2.position.set(0, -seg1Len - seg2Len / 2, 0.004);
    seg2.rotation.x = f.curl * 1.5;
    seg2.castShadow = true;
    fingerGroup.add(seg2);

    handGroup.add(fingerGroup);
  });

  return handGroup;
}

/**
 * Builds the realistic human 3D avatar with separate, independently controllable
 * clothing nodes: Shirt, Trousers, and Shoes.
 */
export function buildRealisticAvatar(
  initialShirtColor: ColorItem | null,
  initialTrousersColor: ColorItem | null,
  initialShoesColor: ColorItem | null
): RealisticAvatarInstance {
  const avatarGroup = new THREE.Group();
  avatarGroup.name = 'RealisticHumanAvatar';

  // --- 1. PROCEDURAL BUMP/TEXTURE MAPS ---
  const cottonTexture = createProceduralTexture('cotton');
  const twillTexture = createProceduralTexture('twill');
  const leatherTexture = createProceduralTexture('leather');

  // --- 2. MATERIALS ---
  // Realistic Human Skin (Warm Natural Tone with fine specular response)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a88b, // Natural Mediterranean/European warm male skin
    roughness: 0.52,
    metalness: 0.02,
  });

  // Clothing Materials with tactile cloth weaves
  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialShirtColor ? initialShirtColor.hex : UNSELECTED_HEX),
    bumpMap: cottonTexture,
    bumpScale: 0.004,
    roughness: 0.68,
    metalness: 0.01,
  });

  const trousersMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialTrousersColor ? initialTrousersColor.hex : UNSELECTED_HEX),
    bumpMap: twillTexture,
    bumpScale: 0.006,
    roughness: 0.75,
    metalness: 0.02,
  });

  const shoesMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialShoesColor ? initialShoesColor.hex : UNSELECTED_HEX),
    bumpMap: leatherTexture,
    bumpScale: 0.008,
    roughness: 0.28,
    metalness: 0.12,
  });

  // Accent Material for sole/buttons
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.15,
    metalness: 0.45,
  });

  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: 0x1e1510, // Dark leather sole
    roughness: 0.6,
    metalness: 0.05,
  });

  // --- 3. ASSEMBLE HEAD & FACE ---
  const head = createSculptedHead(skinMaterial);
  avatarGroup.add(head);

  // --- 4. ASSEMBLE SHIRT (CHEST, SHOULDERS, SLEEVES, COLLAR, PLACKET) ---
  const shirtGroup = new THREE.Group();
  shirtGroup.name = 'ShirtNode';

  // Contoured Torso (Pectoral chest taper down to tailored waist)
  const chestGeo = new THREE.CylinderGeometry(0.24, 0.185, 0.52, 32);
  chestGeo.scale(1.0, 1.0, 0.74); // Natural human torso cross-section
  const chestMesh = new THREE.Mesh(chestGeo, shirtMaterial);
  chestMesh.position.set(0, 1.28, 0);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  shirtGroup.add(chestMesh);

  // Tailored Shirt Collar Band & Spread Points (Open neck style as in photo)
  const collarStandGeo = new THREE.CylinderGeometry(0.082, 0.092, 0.045, 24);
  collarStandGeo.scale(1.0, 1.0, 0.9);
  const collarStand = new THREE.Mesh(collarStandGeo, shirtMaterial);
  collarStand.position.set(0, 1.52, 0);
  collarStand.castShadow = true;
  shirtGroup.add(collarStand);

  // Left & Right Spread Collar Lapels
  const lapelGeo = new THREE.BoxGeometry(0.065, 0.075, 0.008);
  const leftLapel = new THREE.Mesh(lapelGeo, shirtMaterial);
  leftLapel.position.set(0.05, 1.51, 0.078);
  leftLapel.rotation.set(-0.25, -0.35, -0.45);
  leftLapel.castShadow = true;
  shirtGroup.add(leftLapel);

  const rightLapel = new THREE.Mesh(lapelGeo, shirtMaterial);
  rightLapel.position.set(-0.05, 1.51, 0.078);
  rightLapel.rotation.set(-0.25, 0.35, 0.45);
  rightLapel.castShadow = true;
  shirtGroup.add(rightLapel);

  // Front Placket Strip down center front
  const placketGeo = new THREE.BoxGeometry(0.026, 0.5, 0.012);
  const placketMesh = new THREE.Mesh(placketGeo, shirtMaterial);
  placketMesh.position.set(0, 1.28, 0.188);
  placketMesh.castShadow = true;
  shirtGroup.add(placketMesh);

  // 5 Pearlescent Buttons
  for (let i = 0; i < 5; i++) {
    const btnGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12);
    btnGeo.rotateX(Math.PI / 2);
    const btn = new THREE.Mesh(btnGeo, buttonMat);
    btn.position.set(0, 1.45 - i * 0.08, 0.196);
    shirtGroup.add(btn);
  }

  // Left Arm & Hand
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.265, 1.47, 0);
  leftArmGroup.rotation.z = -0.09;

  // Deltoid Shoulder Cap
  const shoulderGeo = new THREE.SphereGeometry(0.082, 20, 16);
  shoulderGeo.scale(1.15, 0.9, 0.85);
  const leftShoulder = new THREE.Mesh(shoulderGeo, shirtMaterial);
  leftShoulder.castShadow = true;
  leftArmGroup.add(leftShoulder);

  // Upper Arm Sleeve
  const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.056, 0.32, 20);
  upperArmGeo.translate(0, -0.16, 0);
  const leftUpperArm = new THREE.Mesh(upperArmGeo, shirtMaterial);
  leftUpperArm.castShadow = true;
  leftArmGroup.add(leftUpperArm);

  // Forearm Sleeve with natural slight forward curve
  const forearmGeo = new THREE.CylinderGeometry(0.056, 0.048, 0.28, 20);
  forearmGeo.translate(0, -0.42, 0);
  const leftForearm = new THREE.Mesh(forearmGeo, shirtMaterial);
  leftForearm.castShadow = true;
  leftArmGroup.add(leftForearm);

  // Cuff with button
  const cuffGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.045, 20);
  cuffGeo.translate(0, -0.56, 0);
  const leftCuff = new THREE.Mesh(cuffGeo, shirtMaterial);
  leftArmGroup.add(leftCuff);

  // Left Anatomical Hand
  const leftHand = createAnatomicalHand(true, skinMaterial);
  leftHand.position.set(0, -0.59, 0);
  leftArmGroup.add(leftHand);

  shirtGroup.add(leftArmGroup);

  // Right Arm & Hand
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.265, 1.47, 0);
  rightArmGroup.rotation.z = 0.09;

  const rightShoulder = new THREE.Mesh(shoulderGeo, shirtMaterial);
  rightShoulder.castShadow = true;
  rightArmGroup.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, shirtMaterial);
  rightUpperArm.castShadow = true;
  rightArmGroup.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(forearmGeo, shirtMaterial);
  rightForearm.castShadow = true;
  rightArmGroup.add(rightForearm);

  const rightCuff = new THREE.Mesh(cuffGeo, shirtMaterial);
  rightArmGroup.add(rightCuff);

  const rightHand = createAnatomicalHand(false, skinMaterial);
  rightHand.position.set(0, -0.59, 0);
  rightArmGroup.add(rightHand);

  shirtGroup.add(rightArmGroup);

  avatarGroup.add(shirtGroup);

  // --- 5. ASSEMBLE TROUSERS (WAISTBAND, CREASES, PLEATS, TAILORED LEGS) ---
  const trousersGroup = new THREE.Group();
  trousersGroup.name = 'TrousersNode';

  // Pelvis / Seat
  const pelvisGeo = new THREE.CylinderGeometry(0.185, 0.192, 0.22, 32);
  pelvisGeo.scale(1.0, 1.0, 0.82);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, trousersMaterial);
  pelvisMesh.position.set(0, 0.96, 0);
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  trousersGroup.add(pelvisMesh);

  // Waistband & Belt Loops
  const waistGeo = new THREE.CylinderGeometry(0.192, 0.192, 0.045, 32);
  waistGeo.scale(1.0, 1.0, 0.83);
  const waistMesh = new THREE.Mesh(waistGeo, trousersMaterial);
  waistMesh.position.set(0, 1.055, 0);
  trousersGroup.add(waistMesh);

  // Front Fly Seam Flap
  const flyGeo = new THREE.BoxGeometry(0.016, 0.18, 0.008);
  const flyMesh = new THREE.Mesh(flyGeo, trousersMaterial);
  flyMesh.position.set(0, 0.98, 0.162);
  trousersGroup.add(flyMesh);

  // Legs with sharp front tailoring creases
  const createLeg = (isLeft: boolean) => {
    const legGroup = new THREE.Group();
    const xPos = isLeft ? 0.1 : -0.1;
    legGroup.position.set(xPos, 0.86, 0);

    // Anatomical Tapered Leg (Thigh, Knee, Calf)
    const legGeo = new THREE.CylinderGeometry(0.088, 0.068, 0.74, 24);
    legGeo.scale(1.0, 1.0, 0.9);
    legGeo.translate(0, -0.37, 0);
    const legMesh = new THREE.Mesh(legGeo, trousersMaterial);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legGroup.add(legMesh);

    // Sharp Tailored Front Crease Ridge
    const creaseGeo = new THREE.BoxGeometry(0.006, 0.72, 0.008);
    const creaseMesh = new THREE.Mesh(creaseGeo, trousersMaterial);
    creaseMesh.position.set(0, -0.37, 0.078);
    legGroup.add(creaseMesh);

    // Trouser Hem Drape over shoe
    const hemGeo = new THREE.CylinderGeometry(0.072, 0.074, 0.04, 24);
    const hemMesh = new THREE.Mesh(hemGeo, trousersMaterial);
    hemMesh.position.set(0, -0.73, 0);
    legGroup.add(hemMesh);

    return legGroup;
  };

  trousersGroup.add(createLeg(true));
  trousersGroup.add(createLeg(false));

  avatarGroup.add(trousersGroup);

  // --- 6. ASSEMBLE SHOES (HANDCRAFTED LEATHER DERBIES) ---
  const shoesGroup = new THREE.Group();
  shoesGroup.name = 'ShoesNode';

  const createRealisticShoe = (isLeft: boolean) => {
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(isLeft ? 0.1 : -0.1, 0.04, 0.02);

    // 1. Shoe Upper (Handmade leather derby silhouette)
    const upperGeo = new THREE.BoxGeometry(0.09, 0.072, 0.22);
    upperGeo.scale(1.0, 0.9, 1.0);
    const upperMesh = new THREE.Mesh(upperGeo, shoesMaterial);
    upperMesh.position.set(0, 0.03, 0.015);
    upperMesh.castShadow = true;
    shoeGroup.add(upperMesh);

    // 2. Sculpted Curved Toe Box
    const toeGeo = new THREE.SphereGeometry(0.046, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    toeGeo.scale(1.0, 0.72, 1.25);
    const toeMesh = new THREE.Mesh(toeGeo, shoesMaterial);
    toeMesh.position.set(0, 0.018, 0.11);
    toeMesh.castShadow = true;
    shoeGroup.add(toeMesh);

    // 3. Stitched Toe Cap Seam
    const capSeamGeo = new THREE.TorusGeometry(0.044, 0.0025, 8, 16, Math.PI);
    capSeamGeo.rotateX(-Math.PI / 2);
    const capSeam = new THREE.Mesh(capSeamGeo, shoesMaterial);
    capSeam.position.set(0, 0.045, 0.07);
    shoeGroup.add(capSeam);

    // 4. Vamp Lacing Eyelets & Cord
    const vampGeo = new THREE.BoxGeometry(0.035, 0.012, 0.08);
    const vamp = new THREE.Mesh(vampGeo, shoesMaterial);
    vamp.position.set(0, 0.068, 0.01);
    vamp.rotation.x = -0.2;
    shoeGroup.add(vamp);

    // Laces
    const lacesMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let k = 0; k < 3; k++) {
      const laceBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.003, 0.003),
        lacesMat
      );
      laceBar.position.set(0, 0.074 - k * 0.009, 0.025 - k * 0.018);
      shoeGroup.add(laceBar);
    }

    // 5. Stitched Leather Outsole Rim (Welt)
    const weltGeo = new THREE.BoxGeometry(0.098, 0.016, 0.235);
    const welt = new THREE.Mesh(weltGeo, shoeSoleMat);
    welt.position.set(0, -0.022, 0.02);
    shoeGroup.add(welt);

    // 6. Stacked Leather Heel
    const heelGeo = new THREE.BoxGeometry(0.092, 0.022, 0.07);
    const heel = new THREE.Mesh(heelGeo, shoeSoleMat);
    heel.position.set(0, -0.03, -0.06);
    shoeGroup.add(heel);

    return shoeGroup;
  };

  shoesGroup.add(createRealisticShoe(true));
  shoesGroup.add(createRealisticShoe(false));

  avatarGroup.add(shoesGroup);

  // --- 7. STUDIO CONTACT SHADOW ---
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0,0,0,0.22)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.08)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.001;
  avatarGroup.add(shadowPlane);

  // --- 8. REAL-TIME COLOR CONTROLLER METHODS ---
  const updateShirtColor = (hex: string) => {
    shirtMaterial.color.set(hex);
    shirtMaterial.needsUpdate = true;
  };

  const updateTrousersColor = (hex: string) => {
    trousersMaterial.color.set(hex);
    trousersMaterial.needsUpdate = true;
  };

  const updateShoesColor = (hex: string) => {
    shoesMaterial.color.set(hex);
    shoesMaterial.needsUpdate = true;
  };

  return {
    group: avatarGroup,
    updateShirtColor,
    updateTrousersColor,
    updateShoesColor,
    shirtMaterial,
    trousersMaterial,
    shoesMaterial,
  };
}
