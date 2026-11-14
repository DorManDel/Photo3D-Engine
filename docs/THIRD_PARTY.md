# Third-party dependencies

- **Google MediaPipe Tasks Vision** JS/WASM, pinned `@mediapipe/tasks-vision@0.10.35`, dynamically loaded from jsDelivr; Google-hosted Face Landmarker float16/v1 model downloaded on user action.
  - Docs: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
  - Assets: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
  - Verify model/binary and redistribution license before bundling them into a package. No model weights committed.
- No cloud API key or hosted inference service.
- No FaceFusion/LivePortrait or Depth Anything dependency in the currently proposed static release.

A non-bundled browser app still requires a network connection to the CDN/model hosts on first analysis. Mobile bandwidth/memory/performance have not yet been measured.
