# Photo3D Reconstruction Studio — milestone M1, source-grounded guide

**Status:** Capture planning and developer education are implemented in the static website. **MICA/DECA/SAM 3D Body inference is NOT installed, invoked or simulated.** The existing Photo Lab still runs real MediaPipe Face Landmarker.

## The mission

Create a modular, provider-independent photo → 3D avatar workflow. Later we want an identity-preserving and animatable *head*, optionally full-body capture, accurate texture, skeleton and camera-driven facial expressions. The system must distinguish observable image features from model-inferred and generated hidden geometry.

### Current tabs

| Tab | Current behavior | Future |
| --- | --- | --- |
| Photo Lab | Real local MediaPipe face detection, official triangle surface, UV image texture, inspector, JSON/PNG export | stabilization, masks and comparison |
| Reconstruction | Four local reference-image slots, image dimensions, selected model study, JSON-only metadata export | MICA/DECA/other model adapter, real mesh output, multi-view benchmarking |
| Motion | Clearly labeled camera-tracking/rig roadmap | opt-in live webcam tracker and retargeting |
| Export | Format/capability readiness explanation | GLB, VRM and Blender→FBX adapters |
| Developer Guide | Plain-English technical walkthrough, tools and their current status | code examples and measured benchmarks |

## Pipeline: what happens and why

```text
User photo(s) (on-device)
   └─ capture/readiness metadata (implemented; no pixels exported)
       └─ preprocessing: face crop, orientation, resolution (planned)
           └─ licensed model runner (MICA or DECA; planned, likely desktop GPU)
               └─ provider adapter normalizes geometry and scale (planned)
                   ├─ mesh + normals + UV/texture (planned)
                   ├─ pose / rig parameters (model-dependent)
                   └─ provenance + measured/inferred labeling
                       └─ comparison viewer (planned)
                           └─ output adapter (GLB first; VRM/FBX later)
```

1. **Inputs:** One frontal face can be sufficient for *a guess* at 3D geometry, but multi-view photos show parts a single image hides. The studio can select four reference images; it does not merge them into a mesh today.
2. **Preprocessing:** Models expect particular face crops, landmark alignment, color spaces, sizes and camera assumptions. This will be a separate adapter and will not overwrite the originals.
3. **Model inference:** MICA estimates an identity-focused facial shape using FLAME; DECA estimates detailed facial geometry plus expression information. Both research repositories require additional assets and licenses.
4. **Normalize:** Store units, coordinate system, material/UV provenance and per-part confidence instead of pretending every model returns identical data.
5. **Compare:** Measure front/side landmarks and silhouette, inspect missing eye/mouth/hair geometry, assess unseen regions separately.
6. **Export/rig:** Validate topology, skeleton/skin weights, facial shape keys and material compatibility before claiming Unity/Unreal/Blender readiness.

## Why not run MICA/DECA directly on GitHub Pages?

GitHub Pages hosts static HTML/JS and assets, not persistent Python/GPU jobs. MICA and DECA are research pipelines with downloaded weights, FLAME dependencies and non-commercial terms. They are **not browser JavaScript libraries** that can be added by a script tag. For future tests, run an explicitly configured local machine/GPU adapter and only use optional server endpoints after user consent and secure transport.

MICA produces a face mesh and FLAME parameters, not an automatically textured rigged full person. DECA can generate expression-aware facial geometry, but it does not solve hair, clothes, the unseen back of the head or a game-ready full-body skeleton.

## Data and contract boundaries

- Web captures remain local in object URLs; clear/close revokes them.
- The downloadable `photo3d.capture-plan.v1` contains only image slot, width, height, MIME and byte size, optional height and chosen research model. **No photos, filenames, paths, facial embeddings or computed identity**.
- Height is stored as an optional reference. No absolute body measurement or camera calibration happens in M1.
- Every new model result must declare provider name/version, legal terms, whether processing is local/remote, what geometry was observed vs inferred and model assets used.
- Images of other people should be used with permission. Do not treat tracking expressions as proof of a person's internal emotions.

## Export and rig strategy

**GLB first:** Portable glTF binary supports mesh, UVs, textures and — once provided — armature skinning, morph targets and animations. This is easier to inspect and version than immediately claiming a full FBX game asset.

**FBX later:** Use a separate Blender conversion/export adapter, validate orientation, transforms, units, bone hierarchy, materials and a Blender → Unity/Unreal import round trip. FBX export cannot conjure missing bones/skin weights.

**VRM for humanoids:** It adds avatar conventions (humanoid bones, expressions, eye look-at and related settings). A valid VRM needs a compliant humanoid rig.

**Automatic skeleton generation** is a separate inference/rigging milestone and must be tested, not inferred from merely having a mesh. Full-body SAM 3D Body is a candidate for a body-specific research branch, not part of the current browser model.

## Model candidate matrix

| Provider | Existing result type | Current integration | License warning |
| --- | --- | --- | --- |
| MediaPipe | Landmarks, relative Z, expression scores | Real browser inference in Photo Lab | Check Google runtime/model terms and usage metrics |
| MICA | FLAME face mesh/parameters, identity reconstruction | Research candidate only | Non-commercial scientific, educational and artistic restrictions; FLAME assets require separate access |
| DECA | Expression-aware detailed face geometry | Research candidate only | Non-commercial scientific research |
| SAM 3D Body | Full-body mesh/pose with MHR | Future research candidate | SAM License and checkpoint access |

**Do not embed research checkpoints or redistribute model outputs in a commercial product without checking the relevant code, weights and underlying model-asset terms.**

## Definition of Done for next milestones

**M1a (this PR):** Accessible workspace tabs, local multi-view reference slots, honest model status, metadata-only export, developer guide and regression tests.

**M1b:** MICA/DECA offline runner experiment in a separate branch/environment (only after assets/license review), with an actual output mesh recorded as evidence.

**M1c:** Compare real reconstructed mesh with existing Photo Lab surface using fixed camera angles and the same subject inputs; no fake inference.

**M2:** Integrate an interoperable, license-compatible export adapter, starting with GLB and explicit validation. Add rig/morph target mappings only when generated and tested.

**M3:** Optional camera tracking → expression/pose normalization → a real rigged avatar, with mobile runtime measurements and permissions.

## Sources and terminology

- Google MediaPipe Face Landmarker: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- MICA code/README and non-commercial LICENSE: https://github.com/Zielon/MICA
- DECA code/README and non-commercial LICENSE: https://github.com/yfeng95/DECA
- SAM 3D Body code/README and SAM License: https://github.com/facebookresearch/sam-3d-body
- Blender glTF exporter: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- VRM features / standardized expressions: https://vrm.dev/en/vrm/vrm_features/
