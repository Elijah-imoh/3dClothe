# Avatar Asset Directory

Place your custom personal 3D male avatar file here:

```text
/public/assets/avatar/my-avatar.glb
```

### Avatar Model Requirements:
1. Format: Binary GLTF (`.glb`) or standard GLTF (`.gltf`).
2. Mesh/Material naming convention (for automatic color binding):
   - Shirt/Top mesh or material name containing: `shirt`, `top`, `tshirt`, or `polo`
   - Trousers/Pants mesh or material name containing: `trouser`, `pant`, `jean`, or `chino`
   - Shoes/Footwear mesh or material name containing: `shoe`, `boot`, `foot`, or `sneaker`
3. If no file is present at this path, FitMe 3D automatically renders the built-in precision studio mannequin with full 3D interactive controls and runtime PBR clothing materials.
4. You can also test custom GLB models on the fly by clicking the "Load Avatar GLB" button directly in the 3D studio viewport!
