# Photo3D Reconstruction Studio — milestone M1, source-grounded guide

**Status (M1b):** Capture planning and a runnable **front-photo → MediaPipe → 2.5D face surface → interactive WebGL → textured GLB** are implemented in the static site. **MICA/DECA/SAM 3D Body inference is NOT installed, invoked or simulated.** This is an image-visible facial mask, not a full head/rig.

## The mission

Create a modular, provider-independent photo → 3D avatar workflow. Later we want an identity-preserving and animatable *head*, optionally full-body capture, accurate texture, skeleton and camera-driven facial expressions. The system must distinguish observable image features from model-inferred and generated hidden geometry.

### Current tabs

| Tab | Current behavior | Future |
| --- | --- | --- |
| Photo Lab | Real local MediaPipe face detection, official triangle surface, UV image texture, inspector, JSON/PNG export | stabilization, masks and comparison |
| Reconstruction | Four local photo slots + true single-image MediaPipe 2.5D mesh inference, GLB export and separate metadata-only JSON | MICA/DECA full-head model adapter, true multi-view benchmarking |
| Motion | Clearly labeled camera-tracking/rig roadmap | opt-in live webcam tracker and retargeting |
| Export | Real JSON/PNG and face-only GLB format statuses | Rigged/complete GLB, VRM and Blender→FBX adapters |
| Developer Guide | Plain-English technical walkthrough, tools and their current status | code examples and measured benchmarks |

## Pipeline: what happens and why

```text
User photo(s) (on-device)
   ├─ capture/readiness metadata (implemented; JSON contains no pixels)
   └─ MediaPipe Face Landmarker (real, local; front photo only)
       └─ official triangles / relative-Z / original image UV (real)
           └─ Three.js preview (real) → GLTFExporter binary GLB (real)
               └─ Blender partial-face geometry inspection (no rig)
       └─ preprocessing: face crop, orientation, resolution (planned for MICA)
           └─ licensed model runner (MICA or DECA; planned, likely desktop GPU)
               └─ provider adapter normalizes geometry and scale (planned)
                   ├─ mesh + normals + UV/texture (planned)
                   ├─ pose / rig parameters (model-dependent)
                   └─ provenance + measured/inferred labeling
                       └─ comparison viewer (planned)
                           └─ output adapter (GLB first; VRM/FBX later)
```

1. **Inputs:** One frontal face can be sufficient for *a guess* at 3D geometry, but multi-view photos show parts a single image hides. The studio can select four reference images; **only the front image is processed by the real browser baseline**, and it does not merge them into a new full-head mesh.
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
- The downloadable `photo3d.capture-plan.v1` contains only image slot, width, height, MIME and byte size, optional height and chosen research model. **No photos, filenames, paths, facial embeddings or computed identity**. The separately requested **GLB export DOES embed identifiable source-face photo pixels** and should be stored carefully.
- Height is stored as an optional reference. No absolute body measurement or camera calibration happens in M1.
- Every new model result must declare provider name/version, legal terms, whether processing is local/remote, what geometry was observed vs inferred and model assets used.
- Images of other people should be used with permission. Do not treat tracking expressions as proof of a person's internal emotions.

## Export and rig strategy

**GLB first:** The current exporter uses Three.js `GLTFExporter`, producing an actual glTF 2.0 binary with indexed **partial face** mesh, original photo-derived UV texture, normals and metadata. It is not an inferred full human face. The glTF format also supports skinning/morph targets/animation when supplied; **none is in this asset yet**. Actual target-editor validation in Blender is still needed.

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

**M1a:** Accessible workspace tabs, local multi-view reference slots, honest model status, metadata-only export, developer guide and regression tests.

**M1b (this iteration):** Generate a real MediaPipe 2.5D mesh from the front photo; render in Reconstruction Studio; download real textured GLB; report source, triangles, open boundaries and observed runtime. Browser E2E must prove GLB structure, embedded image and absence of invented rig. The other views remain unused by inference.

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

## M1b — What happens when you click Generate?

1. **Input decode:** the browser decodes the locally chosen front image, without server upload.
2. **Real inference:** MediaPipe Face Landmarker downloads official model/runtime as needed and produces image-relative `x,y,z` for hundreds of landmarks.
3. **Geometry validation:** the official tessellation edge triplets form indexed triangles, normalized into actual XYZ and UV buffers. Z is *relative*, never claimed as centimeters.
4. **Surface audit:** count open boundaries, connected components and invalid non-manifold edges. Do not guess missing eye interiors or head surfaces.
5. **Render:** Three.js allocates a real GPU mesh and displays the source pixels as UV texture. Orbit with yaw/pitch sliders, adjust zoom, inspect wireframe.
6. **Export:** only on request, GLTFExporter serializes that mesh and a bounded texture into a self-contained binary `.glb`. It contains the person's face image pixels. Imported objects have no armature.
7. **Research branches:** MICA/DECA require separate licensed Python/GPU experiments; full-head inference and multiple-photo fusion are different workstreams.

### Practical cost/time behavior

- The page itself remains static GitHub Pages; no user npm or server required.
- Model/runtime and Three.js are downloaded when first needed. Actual size/time depends on network/browser; do not promise a fixed duration.
- MediaPipe inference runs locally on the phone or PC. The UI reports **measured single-run inference + geometry time** (excluding initial asset download and export time); it is not a benchmark of the model's overall accuracy.
- Real GLB filesize scales with the photo texture, bounded to 1024px for the exported asset. Geometry includes only a few hundred vertices and official face triangles.
- The current pipeline uses exactly **1 front image** even when four were uploaded; the other views are reference data, not consumed by inference.
- GPU WebGL and Three.js/GLTFExporter need browser support, available memory and connectivity to the pinned CDN.
- Only a production-ready reconstruction provider + validated geometry/rigging/export pipeline can justify calling the result a complete Blender/Unity/Unreal avatar.

References: Khronos glTF 2.0 binary standard https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html ; Three.js exporter https://threejs.org/docs/pages/GLTFExporter.html .
