# Photo3D Engine

A **modular, local-first portrait-analysis toolkit**. The first deployable lab is a **real MediaPipe Face Landmarker proof of concept**, not a 3D head reconstruction or animated portrait.

## Run without npm or a personal server

After the owner reviews and merges the feature PR, enable **GitHub Pages → Deploy from a branch → main → /(root)**. Open `https://dormandel.github.io/Photo3D-Engine/`. Browsers load the static HTML and the pinned MediaPipe runtime/model from Google's distribution/CDN. No CLI, npm, or Python backend is required **for this milestone**.

Do **not** confuse the repository link with a live Pages URL until the owner enables Pages and verifies deployment.

## What this experimental release really does

- Imports a portrait **locally**; no upload endpoint.
- On explicit click, loads MediaPipe Face Landmarker and detects facial landmarks in the image.
- Shows the same landmarks over the photo and in a second, rotatable **relative-3D point projection**.
- Supports local JSON export of the detected points, expression coefficients and provenance.
- Shows actionable error states for missing faces, unavailable model downloads and unsupported browsers.
- Guards against stale inference results when photos are changed during analysis and rejects unusually large images.

**Not implemented:** real monocular depth inference, depth mesh, eyelid rig, blinking, LivePortrait, full 3D head, polished package distribution. The previously generated v0.2 TypeScript foundation remains a separate ZIP artifact, **not** in this repository. We will reconcile its contracts later instead of claiming it is already checked in.

## Package direction (not all implemented)

```
core pipeline / contracts       (proposed shared package)
├── face adapters                (MediaPipe browser implemented here)
├── depth adapters               (browser / HTTP proposed)
├── renderer adapters            (Three.js proposed; current point view uses Canvas2D)
├── animation adapters           (future)
└── exporters                    (JSON export included in lab)
apps/photo3d-lab                 (this static lab)
```

Current code is purposefully split between `src/contracts.js` (stable normalized data), `src/models/mediapipe.js` (provider), `src/visualization.js` (views), and `src/app.js` (controller). This boundary is the first step toward a versioned NPM package; do not advertise it as published.

## Development and checks

- No build or npm install needed for the static site once deployed to HTTPS.
- Run `node --test tests/*.test.mjs` if you want local offline contract checks (Node 20+).
- CI runs offline contract checks plus an **automated Chromium browser smoke test** that downloads the public reference portrait temporarily on the CI runner. Automated Chromium is not a substitute for actual Galaxy device testing.
- Verify on Chrome/Edge desktop and Galaxy Android after publication.
- MediaPipe code, WASM and model are downloaded on demand from third-party hosts. For air-gapped/offline use, we would need a separately licensed/packaged distribution.

## Governance

Branch → tests → reviewable PR → **explicit owner approval** → deploy → phone/desktop verification. Private project context and activity stay in the private PCM repository. Images are not stored in this repository or silently uploaded.
