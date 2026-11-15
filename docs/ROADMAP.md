# Photo3D Engine — Living Avatar Roadmap

**Status:** planning + research workspace proposal (review branch; not released).  
**Primary source:** https://github.com/DorManDel/Photo3D-Engine  
**Private context:** `ProjectContextManager/projects/photo3d-engine/` (never expose private PCM on the public site).

## Mission

Build a local-first engine that transforms opt-in photos, prerecorded video and live facial motion into usable **rigged avatars** for webcam scenes and game engines. Separate **tracking** from **reconstruction** and **avatar animation**. A face-landmark topology is not a metric full-head scan.

## Milestone contract

| ID | Delivery | Current status | Primary acceptance |
|---|---|---|---|
| M0 | Portrait face landmarks + relative topology inspector | Existing v0.3 source merged; Chromium/hosted smoke verified | Model-produced 478 points, synchronized views, official edges, orbit and JSON; physical Samsung v0.3 unverified |
| M1 | Webcam motion capture | Planned — next | Opt-in start/stop, 52 face blendshape coefficients when supported, head pose, motion normalization, tracking loss, desktop + phone measurements |
| M2 | Rigged avatar puppeteering | Planned | Licensed GLB/VRM with smile/blink/jaw/head rotation; calibration, smoothing, record/replay |
| M3 | Webcam/OBS scene studio | Planned | Transparent scenes and OBS browser source, stable observed latency, no automatic user-media uploads |
| M4 | Photo/video reconstruction | Research planned | Model/license inventory, multiview alignment, textured surface, depth provenance and measured reference error when available |
| M5 | Blender/Unity/game + 3D print export | Planned | Animated GLB/VRM import, static OBJ where appropriate, STL with watertight/manifold/scale validation |
| M6 | Advanced avatar AI FX | Later | Separate audio-driven/hand/body adapters, comparative quality and performance evidence |

**No planned milestone is a working feature** until a source commit and test evidence are recorded. Tests in the site are manual log entries, **not** automatically measured accuracy.

## Workbench tabs

- **Portrait Lab:** keep current real MediaPipe IMAGE mode and all working UI controls.
- **Avatar Studio:** capability map; no fake live avatar or 3D reconstruction demo.
- **Experiment Lab:** nested Tracking, Reconstruction, Animation and Export test categories; save manually observed status and notes to browser-only storage and export JSON.
- **Roadmap:** status and evidence requirements, backed by `src/workspace-data.js`.

## Architecture direction

```text
input adapters (photo / video / webcam)
  -> face tracking provider (MediaPipe; other providers only after licensing review)
  -> provider-independent FaceMotionFrame
  -> smoothing, calibration, tracking-loss handling, recording
  -> avatar runtime (GLB/VRM rig)
  -> renderer / OBS scene / Unity adapter
separate reconstruction pipeline (photo / multiview / video)
  -> geometry + texture + rig fit
  -> GLB/VRM or validated print mesh
```

## Quality and privacy gates

1. Keep input files/camera local by default. Runtime/model downloads require understandable disclosure; cloud providers only by informed opt-in.
2. Measurements: inference time, presentation FPS, input-to-avatar latency, landmark jitter, tracking-loss rate and error against a ground-truth scan when available. Distinguish FPS/latency targets from actual observations.
3. Test on desktop Chrome/Edge and real Samsung Galaxy browser. CI Chromium is not physical device testing.
4. Record external model license and data-handling conditions before integration. Do not commit photographs or biometric logs.
5. Source → evidence mapping → prototype → static/real-browser/mobile tests → reviewable PR → **explicit owner approval** → publish and verify deployed SHA.
6. Keep private PCM handoff, decisions, changelog and tasks current on significant milestones.

## Initial engineering sequence

1. Ship navigable single-site workspace tabs + manual test journal, with no regression in portrait analysis.
2. Audit browser capture and MediaPipe VIDEO mode API, plan a `FaceMotionFrame` versioned schema.
3. Implement camera lifecycle safely (start/stop, switch source, permission errors, visibility/background handling).
4. Add expression & head-pose inspector, recording/replay and tracked performance measurements.
5. Select and license-check a rigged avatar; use a separate avatar runtime to drive it from normalized expressions.
6. Only then prototype head reconstruction, exports and OBS integration.

**Source of truth for issue tracking:** GitHub Issues/PRs, with evidence-linked PCM project summaries.
