# Photo3D Engine

A **modular, local-first portrait-analysis toolkit**. The first deployable lab is a **real MediaPipe Face Landmarker proof of concept**, not a 3D head reconstruction or animated portrait.

## Run without npm or a personal server

**Live beta:** https://dormandel.github.io/Photo3D-Engine/ — already deployed via GitHub Pages from `main`. Browser and model inference checks passed against the hosted URL. No CLI, npm, or Python backend is needed to use this pilot.

Open the site, click **Use portfolio sample** to load the reference image directly from the owner's public portfolio, then **Analyze face**. You can also choose any local PNG/JPEG/WebP. The pinned MediaPipe model is downloaded on explicit analysis; the phone's first run requires network access.

## Workspace expansion (review branch)

A single-site workspace adds four **top-level tabs**: Portrait Lab (existing real inference), Avatar Studio (clearly marked planned), Experiment Lab (nested test categories, manual localStorage journal and JSON export), and Roadmap (M0–M6 acceptance criteria). The workbench does not claim that avatar capture, 3D reconstruction or export already exists. See [engineering roadmap](docs/ROADMAP.md).

The manual test journal records **user-entered outcomes**, not automatically measured accuracy, and keeps them in the current browser until explicitly exported or browser storage is cleared. Do not enter sensitive image, face or video data in notes. Private checkpoint details remain in PCM and are never loaded by the public site.

## What this experimental release really does

- Imports a portrait **locally**; no upload endpoint. Optional one-click sample fetched from the existing public portfolio GitHub image, without bundling its bytes.
- On explicit click, loads MediaPipe Face Landmarker and detects facial landmarks in the image.
- Shows the same landmarks over the photo and in a zoomable, drag-to-orbit **relative-3D topology inspector**. Official MediaPipe connection edges power points, wireframe and contour modes.
- Centers the inspector on the detected face rather than the image center, and can overlay the official tessellation on the photo.
- Supports local JSON export of the detected points, expression coefficients and provenance.
- Shows actionable error states for missing faces, unavailable model downloads and unsupported browsers.
- Guards against stale inference results when photos are changed during analysis and rejects unusually large images.

**Not implemented:** real monocular depth inference, dense/textured head mesh, eyelid rig, blinking, LivePortrait, full 3D head, polished package distribution. MediaPipe topology makes a relative face surface preview, not true calibrated 3D. The previously generated v0.2 TypeScript foundation remains a separate ZIP artifact, **not** in this repository. We will reconcile its contracts later instead of claiming it is already checked in.

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
- Run `node --test tests/*.test.mjs` for offline contract and workspace checks (Node 20+).
- CI runs offline contract checks plus an **automated Chromium browser smoke test** that downloads the public reference portrait temporarily on the CI runner. Automated Chromium is not a substitute for actual Galaxy device testing.
- Verify on Chrome/Edge desktop and Galaxy Android after publication.
- MediaPipe code, WASM and model are downloaded on demand from third-party hosts. For air-gapped/offline use, we would need a separately licensed/packaged distribution.

## Governance

Branch → tests → reviewable PR → **explicit owner approval** → deploy → phone/desktop verification. Private project context and activity stay in the private PCM repository. Images are not stored in this repository or silently uploaded.
