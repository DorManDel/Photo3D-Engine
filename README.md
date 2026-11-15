# Photo3D Engine

A **modular, local-first portrait-analysis toolkit**. The first deployable lab is a **real MediaPipe Face Landmarker proof of concept**, not a 3D head reconstruction or animated portrait.

## Run without npm or a personal server

**Live beta:** https://dormandel.github.io/Photo3D-Engine/ — already deployed via GitHub Pages from `main`. Browser and model inference checks passed against the hosted URL. No CLI, npm, or Python backend is needed to use this pilot.

Open the site, click **Use portfolio sample** to load the reference image directly from the owner's public portfolio, then **Analyze face**. You can also choose any local PNG/JPEG/WebP. The pinned MediaPipe model is downloaded on explicit analysis; the phone's first run requires network access.

## v0.4 — Textured Face Mesh Preview

**Purpose:** Test whether the visible facial features retain their appearance when the original image is placed on MediaPipe's *actual triangle mesh*. This is the requested step between point-cloud inspection and real AI depth.

After loading the public sample or a local portrait and clicking **Analyze face**, choose **Textured mesh** or **Texture + wireframe** in the right inspector. The user can drag to orbit (pinch on phones), zoom, flatten/exaggerate the **relative MediaPipe Z**, compare against the original face crop, reset the view and save a PNG of the textured surface.

**Do not confuse this with AI depth.** The image-visible face is textured; background, hair outside the facial mesh, ears and hidden side surfaces are NOT recreated. Larger yaw angles reveal why reconstruction needs more than a single photograph. The face can have discontinuities near the hair/beard boundaries. No fabricated layers and no secret external face APIs.

### Implementation boundaries

| Package-ready module | Responsibility | Present? |
| --- | --- | --- |
| `src/geometry/face-triangles.js` | Verify official directed edge triplets; image-proportion-preserving XYZ, UV, indexed triangle data | Yes — pure JavaScript |
| `src/geometry/face-topology.js` | Normalize provider topology, retaining official triangles before deduplicating edges | Yes |
| `src/renderers/three-textured.js` | Optional Three.js texture/mesh/PNG adapter, lazy WebGL init, bounded texture, resource cleanup | Yes |
| `src/visualization/face-reference.js` | Original photograph crop for mobile comparison | Yes |
| `src/app.js` | Swap modes, user controls, touch orbit/pinch, error fallback | Yes |
| Browser AI depth provider | Real depth inference | Not yet |
| Publishable NPM package | Bundled/tested distributable modules | Not yet |

Model and original photo stay in browser memory; the browser downloads Three.js only when textured mode is selected. Local image analysis remains on device. Third-party runtime/CDN requests are explicit and documented.

## What this experimental release really does

- Imports a portrait **locally**; no upload endpoint. Optional one-click sample fetched from the existing public portfolio GitHub image, without bundling its bytes.
- On explicit click, loads MediaPipe Face Landmarker and detects facial landmarks in the image.
- Shows landmarks over the photo and in a zoomable, drag-to-orbit **relative-3D topology inspector**. Official connection edges power points, wireframe and contour modes.
- **v0.4:** face-only real-image texture on the official triangle mesh, optional wire overlay, relative-Z comparison, original reference crop and PNG export.
- Centers the inspector on the detected face rather than the image center, and can overlay the official tessellation on the photo.
- Supports local JSON export of the detected points, expression coefficients and provenance.
- Shows actionable error states for missing faces, unavailable model downloads and unsupported browsers.
- Guards against stale inference results when photos are changed during analysis and rejects unusually large images.

**Not implemented:** real monocular depth inference, reconstructed full head/hair/background, eyelid rig, blinking, LivePortrait, polished package distribution. Our face-only textured mesh is a 2.5D UV mapping experiment, not a complete model. MediaPipe topology makes a relative face surface preview, not true calibrated 3D. The previously generated v0.2 TypeScript foundation remains a separate ZIP artifact, **not** in this repository. We will reconcile its contracts later instead of claiming it is already checked in.

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
