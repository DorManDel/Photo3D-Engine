# Photo3D v0.4 — UV-textured MediaPipe face topology (design + implementation)

## Goal and evidence
- Input: single original photograph + **real MediaPipe face landmarks and official tessellation edge list**.
- New output: only the photo-visible face portion textured on indexed triangles, inspectable at different yaw/pitch/zoom and relative Z scales.
- The left image and the right mesh share the exact normalized model output. No 3D shape is invented from a decorative blob.

## Modular source map
```
src/models/mediapipe.js
    -> src/contracts.js
      -> src/geometry/face-topology.js   (model triangle topology)
      -> src/geometry/face-triangles.js  (validated triples, XYZ, UV, indices)
    -> src/renderers/three-textured.js   (optional browser WebGL / PNG)
    -> src/visualization/face-reference.js (real crop comparison)
    -> src/app.js                       (mode, drag, pinch, exports)
```

### Triangle validation
The official tessellation arrives in successive directed groups `[a→b,b→c,c→a]`. We extract the three unique vertices **before** deduplicating wireframe edges; an arbitrary edge collection is *never* triangulated by guessing. Invalid/degenerate or out-of-range triangles are rejected. No fallback fabricated geometry.

### Geometry / UV
- Image-normalized `x,y` are converted into original photo pixel space (`x*width, y*height`), then recentered/scaled uniformly. **Image aspect ratio is preserved**.
- MediaPipe's relative `z` is converted to display scale using image width. `Relative Z` only flattens/exaggerates this approximate geometry.
- Source image is retained as the texture: vertex UV `(x,1-y)` in Three.js's bottom-up mapping convention, with `HTMLImageElement`/canvas `flipY=true`.
- Underlying `BufferGeometry` stores indexed triangles and original UV samples. Mesh material is unlit (preserves original photograph colors). Optional overlay exposes edges for diagnosis.
- Original reference crop is a separate display thumbnail for mobile comparison; it is **not** a fake 3D background.
- WebGL is initialized only on demand and retains a bounded (max 1536px) source texture. There is no perpetual render loop; it redraws on interaction and resize.

### Web / distribution
- Public GitHub Pages static deployment; no user npm, Python service or API key.
- Three.js ES module dynamically loaded from pinned jsDelivr version; model still downloaded only after Analyze.
- The pure geometry/topology/UV functions have no Three.js or DOM dependency and are future NPM/ESM package boundaries.
- Other renderers can consume the same normalized surface interface; do not build model inference into renderer.
- PNG export uses the real WebGL canvas.

### Acceptance gates
1. Pure contract tests: official edge triplets, no guessed triangles, UV values, portrait aspect, no mutation, Z flattening and invalid input.
2. Full Chromium: public portfolio reference → MediaPipe real model → >700 triangles → visible WebGL pixels → touch/slider modes → PNG with valid signature → 390px viewport no overflow.
3. GitHub Pages release + published URL smoke; **physical Galaxy Samsung Browser evidence still required**, especially face/color alignment, eyes/lips/beard distortions, GPU reliability and performance.

### Known visual boundaries
- Textured face mesh covers only the model-supported facial region; no hair/head silhouette, ears, neck or background reconstruction.
- A single photograph does not reveal skin or geometry behind the face, so yaw beyond ~40° is approximate and warned about.
- Relative MediaPipe Z is not a calibrated depth map; geometry may stretch or fold at extreme rotations.
- **Next**: separate depth-provider integration, segmentation/occlusion strategy, then real perspective-correct surface/animation rigs and package publishing.

## References
- MediaPipe tessellation source: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/vision/face_landmarker/face_landmarks_connections.ts
- Three.js geometry: https://threejs.org/docs/pages/BufferGeometry.html
- Three.js texture: https://threejs.org/docs/pages/Texture.html
