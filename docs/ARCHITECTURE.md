# Photo3D — official MediaPipe topology inspector

## Evidence-backed source graph

1. `src/models/mediapipe.js` imports the pinned Google Tasks Vision library and reads `FaceLandmarker.FACE_LANDMARKS_TESSELATION` and `FACE_LANDMARKS_CONTOURS` (documented official connectivity).
2. `src/geometry/face-topology.js` validates/deduplicates connection edges and computes face-centered relative-Z view coordinates. This module is pure JS and independent of DOM/renderer.
3. `src/contracts.js` keeps `photo3d.landmarks.v1`, now adding optional `topology` data identified by `photo3d.face-topology.v1` from the same real inference.
4. `src/visualization.js` renders the original photo and inspector from this **same result**: dots, mesh overlay, official wireframe and contours, no synthesized landmarks.
5. `src/app.js` owns UI state, touch/mouse orbit, zoom, reset and JSON export, separate from geometry logic.
6. `tests/contracts.test.mjs` tests contracts/projection. `tests/browser-smoke.mjs` checks official topology count, different views, zoom and full browser model inference.

## What this does not mean

The mesh is connectivity of the image-visible face using MediaPipe's relative coordinates. This is **not** a depth map, reconstructed head, textured 3D mesh, physically calibrated surface or blinking rig. Hidden surfaces remain unknown. Do not advertise it otherwise.

## Next adapters

- `depth`: vetted browser AI depth model, clearly labeled relative vs metric distance; independent provider errors/telemetry.
- `renderer`: Three.js/WebGL consuming normalized geometry and optional depth, replaceable without changing the AI provider.
- `animation`: separate facial rig or model-based renderer after verifying realistic blink quality and licensing.
- `packages`: reconcile prior TypeScript v0.2 prototype and versioned interface contracts; current browser pilot is not a published NPM engine.

## References

- MediaPipe Face Landmarker API: https://developers.google.com/edge/api/mediapipe/js/tasks-vision.facelandmarker
- Google Face Landmarker guide: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
