# Photo3D Engine

A **modular, local-first portrait-analysis toolkit**. The browser lab combines **real MediaPipe face landmarks and original-image UV texturing**. It is a diagnostic 2.5D surface, not a reconstructed head or animated portrait.

## Milestone M1c — offline MICA reconstruction bridge

An independent research adapter `tools/mica/run_mica.py` now invokes **the actual
upstream MICA demo** when executed in a user-provided, licensed CUDA Python
environment. It checks MICA/FLAME/InsightFace asset paths, stages one local
image privately, validates the real output `mesh.obj`, and creates a
`photo3d.research-mesh.v1` metadata manifest. **No model weights, face data,
FLAME files or credentials are distributed here.** We have not yet run MICA
inference on the owner's own GPU.

The Reconstruction Studio additionally imports user-supplied triangle OBJ
meshes using the official Three.js OBJLoader, previews them independently
of the real MediaPipe 2.5D baseline and exports a separate **untextured GLB**
through the official GLTFExporter. Structural validation cannot verify
that a file really came from MICA. Neither the OBJ import nor synthetic
contract test fixtures are evidence of MICA inference. No new model is
silently substituted for it.

**Start here:** [Run MICA locally and inspect a real mesh](docs/MICA_RUNNER.md).
Before using the MICA software/model or FLAME2020, read their restrictive
non-commercial licences. Do not use the upstream password-based
insecure-`wget` installer without security review.

## Milestone M1 — modular Avatar Studio workspaces

New top-level tabs preserve the working Photo Lab and add independent **Reconstruction**, **Motion**, **Export**, and **Developer Guide** workspaces.

- **Reconstruction Studio (M1b):** prepare up to four local photos and run a genuine **single-front-image MediaPipe 2.5D face inference**. It produces official indexed triangles with original UV-texture, renders a new interactive Three.js view and exports a real binary **.glb** (mesh + source photo texture). Side photos are NOT fused, no complete head/eye fill/skeleton exists, and MICA/DECA are still NOT installed. Metadata-only capture-plan JSON also remains available.
- **Motion Lab:** explicit blueprint for opt-in camera tracking and rig retargeting; no webcam access is requested.
- **Export Studio:** real capability matrix. Exports: landmarks JSON, snapshot PNG, and **face-only textured GLB** from Reconstruction baseline. No FBX/VRM or rigged full person.
- **Developer Guide:** simple programming explanations of landmarks, UVs, model adapters, rigging and file formats.
- Independent static modules: `src/studio/studio.js`, `src/studio/capture.js`, `src/studio/model-catalog.js`; the original face engine is unchanged.

Read [the detailed developer and milestone plan](docs/RECONSTRUCTION_STUDIO.md). The GLB uses Three.js's official GLTFExporter add-on (lazily imported from the pinned CDN, using an import map), not a custom invented file format. Actual MICA/DECA inference requires an isolated reviewed GPU/Python adapter, model-asset access and **non-commercial license checks**. Do not claim the research candidates run in this browser.

## Run without npm or a personal server

**Live beta:** https://dormandel.github.io/Photo3D-Engine/ — already deployed via GitHub Pages from `main`. Browser and model inference checks passed against the hosted URL. No CLI, npm, or Python backend is needed to use this pilot.

Open the site, click **Use portfolio sample** to load the reference image directly from the owner's public portfolio, then **Analyze face**. You can also choose any local PNG/JPEG/WebP. The pinned MediaPipe model is downloaded on explicit analysis; the phone's first run requires network access.

## v0.4.1 — Geometry & feature diagnostics

The inspector now supports **Visible surface**, **X-Ray** and **Open borders** when displaying a textured wireframe. Surface lines are depth-tested by default; X-Ray intentionally shows hidden lines. Open borders are derived from actual triangle edge usage, with counts for boundary edges/components and non-manifold edges. These are *mesh measurements*, not an automatic label for eye holes.

The **Eyes + lips** toggle highlights real MediaPipe feature connection lists on the original image. It does not generate eyeballs, mouth interiors or blink animation. **Compare 0°** sets yaw/pitch to zero and relative Z to zero while enlarging the original crop for side-by-side inspection; use Reset view to restore default depth.

The audit is pure JS and included in the private experimental `@webforge/photo3d-face-surface@0.4.1-dev.0` build, without model weights or any Three.js dependency. E2E checks exercise real provider regions and actual renderer depth behavior. See [Provider Roadmap](docs/PROVIDER_ROADMAP.md) before adding expensive models.

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
