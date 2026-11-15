# Third-party dependencies

- **Google MediaPipe Tasks Vision** JS/WASM, pinned `@mediapipe/tasks-vision@0.10.35`, dynamically loaded from jsDelivr; Google-hosted Face Landmarker float16/v1 model downloaded on user action.
  - Docs: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
  - Assets: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
  - Verify model/binary and redistribution license before bundling them into a package. No model weights committed.
- No cloud API key or hosted inference service. MediaPipe's published privacy notice states that model input stays on device, but SDK performance/usage metrics may be sent to Google: https://www.npmjs.com/package/@mediapipe/tasks-vision . Do not promise that *all* network traffic is absent.
- No FaceFusion/LivePortrait or Depth Anything dependency in the currently proposed static release.

A non-bundled browser app still requires a network connection to the CDN/model hosts on first analysis. Mobile bandwidth/memory/performance have not yet been measured.

- **Three.js `three@0.187.0`**, JavaScript/WebGL 3D renderer loaded lazily from jsDelivr in `src/renderers/three-textured.js`. [Official source and MIT license](https://github.com/mrdoob/three.js). It is not uploaded to a user photo service, and no credentials are used. For a future package/reproducible offline release, bundle the pinned dependency with its license and CSP/integrity policy.
