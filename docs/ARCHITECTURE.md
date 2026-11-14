# Architecture evidence — Photo3D static pilot

## Source-to-flow

1. `index.html` asks the user to select a local portrait and opt into analysis. **Source implemented; runtime unverified.**
2. `src/app.js` decodes the local file and calls `analyzeFace(image)` only on the Analyze click. **Source implemented.**
3. `src/models/mediapipe.js` loads pinned MediaPipe JS/WASM and Google's official task model and calls `FaceLandmarker.detect`. **Source implemented; CDN/model download and inference not runtime tested.**
4. `src/contracts.js` maps the model's returned landmarks to a stable result object; throws for missing/invalid coordinates. **Source implemented; offline contract test defined.**
5. `src/visualization.js` draws the image overlay and a **relative XYZ projection** derived from the SAME model points. **Source implemented; visually unverified.**
6. `src/app.js` can export the normalized result JSON on demand, locally. **Source implemented; browser download not tested.**

## Explicit boundaries

- Relative MediaPipe Z is **not** physically calibrated depth; the inspector is a rotated point visualization.
- No image is sent from application code to a server. The application **does** load third-party code/model assets when activated; runtime/network privacy must be reviewed.
- No Depth Anything, Three.js geometry, real blinking or LivePortrait has been integrated.
- This plain JS static prototype is a separate browser delivery path; integrating the earlier v0.2 TypeScript/NPM foundation requires an audited migration and adapter contracts.

## Next gates

Review PR, verify CI on exact SHA, enable Pages only after owner approves, verify real inference in Chrome/Edge and Samsung browser, then implement depth adapter and export test matrix.
