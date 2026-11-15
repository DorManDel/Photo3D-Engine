# Photo3D — Modular provider roadmap (proposals, not implemented)

**Status:** Architecture research, 2026-11-15. The v0.4.1 diagnostics do not infer hidden anatomy or segment hair. No third-party photos are sent to an inference API.

## Current dataflow

```text
[Local photo] -> [MediaPipe FaceLandmarker] -> [Normalized landmarks + ordered triangles]
                       |                       |
                 [official eye/lip edges]     [Pure surface geometry + surface audit]
                       |                       |
                 [source-photo diagnostics]  [Three.js renderer]
                                                   |
                                            [Surface / X-Ray / Borders]
```

The UI and renderer never create or modify the AI provider's inference result.

## Candidate independent adapters

| Module | Trusted existing technology | Planned output contract | Open questions |
| --- | --- | --- | --- |
| `face-surface` | Current MediaPipe landmarks and triangle graph | versioned XYZ/UV/index buffers and boundary audits | Validate extreme yaw and hidden-surface holes |
| `eye-regions` | MediaPipe official eye/iris contours and eyeBlink blendshapes | eye geometry regions with source UV, masks and confidence | Eye interiors and blink closure require a real eye surface/rig, not skin-colored hole filling |
| `mouth-regions` | MediaPipe lip contours, jawOpen/mouth blendshapes | lip/mouth geometry with separate interpolation controls | Teeth and mouth interior are not visible from a still image |
| `subject-segmentation` | MediaPipe Image Segmenter, HairSegmenter and SelfieMulticlass | per-pixel category mask + provider/version + resolution | Hair/skin/clothes/accessories labels aren't a complete head reconstruction |
| `depth` | Apache-2.0 ONNX Depth Anything V2 Small through Transformers.js | typed relative depth map + orientation/scale + provider metadata | GPU/CPU memory, model download, inference latency, pose alignment; not metric distance |
| `occlusion-compositor` | Three.js masks, depth buffers and independently produced segmentation | ordered region compositing with unambiguous source confidence | Missing side-of-head geometry must remain explicitly unknown |

References: [MediaPipe FaceLandmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker), [Face Landmarker connection constants](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.facelandmarker), [Image Segmenter models](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter), [ONNX Depth Anything V2 Small](https://huggingface.co/onnx-community/depth-anything-v2-small).

## Replaceable contracts

Each adapter should expose `id`, `version`, `capabilities`, `analyze(input, options)`, `dispose()` and a typed, versioned result. Build core as ESM/TypeScript-package-friendly modules, without hard-coding UI/Three.js. Explicit activation and download consent; no silent network upload; no fabricated geometry on inference failure. Preserve source/model metadata for all exports.

Future eye/mouth interpolation must distinguish **geometric deformation**, **visible-pixel texture interpolation** and **generative inpainting**. Those methods have different artifacts, privacy risks, costs and rights. Begin with model-provided features + visible geometry only. A still photograph cannot identify the unseen retina, teeth, interior mouth or back of the head.

## Acceptance ladder

1. v0.4.1: Measure boundary gaps; compare 0°, 15°, 30°, 45° at original colors; verify eye/lips labels and depth-test behavior.
2. v0.5: Optional mask provider with real source-derived face/hair/accessory labels and alpha/occlusion visualization.
3. v0.6: Depth inference with quantified download, memory and mobile latency, compared to MediaPipe relative Z.
4. v0.7+: Replaceable eyelid/eye/mouth surfaces and animation adapter, with visual tests against real photos and licensed model weights.

**Do not represent any of 2–4 as implemented until source, CI, actual device verification and owner-approved publication are available.**
