/** Planned milestones and manual test definitions; not measured benchmark output. */
export const milestones = Object.freeze([
  {id:"M0",title:"Portrait Landmarks & Relative Topology",state:"shipped",summary:"Existing MediaPipe 478-point detection, synchronized photo overlay and relative 2.5D inspector.",acceptance:["Image analysis uses real model output","Both views consume the same landmarks","Wireframe/contours, orbit, zoom and JSON export are verified in Chromium"],limitations:"Physical v0.3 Samsung acceptance still pending."},
  {id:"M1",title:"Live Webcam & Face Motion",state:"next",summary:"Opt-in video input, expression coefficients, head-pose matrix, stable FaceMotionFrame and motion recording.",acceptance:["Consent-based start/stop releases camera tracks","Live signal distinguishes lost tracking from neutral expression","Motion capture and latency measured on desktop and phone"],limitations:"Not implemented."},
  {id:"M2",title:"Rigged Avatar Motion",state:"planned",summary:"Load a licensed GLB/VRM avatar; map facial motion to blendshapes with calibration, smoothing and replay.",acceptance:["Smile/blink/jaw/head pose drive an actual rig","Playback matches a recorded motion sequence","Source-to-avatar latency measured"],limitations:"Not implemented."},
  {id:"M3",title:"Webcam Studio & OBS",state:"planned",summary:"Transparent-background scenes, stream-friendly UI, OBS browser source and virtual camera integration.",acceptance:["Scene works in OBS browser source","No unintentional media uploads","Stable sustained-runtime performance measured"],limitations:"Not implemented."},
  {id:"M4",title:"Photo / Multi-view Reconstruction",state:"planned",summary:"Research still/photo/video inputs, reconstruction models, texture and geometry quality; separate inferred and measured depth.",acceptance:["Document model licenses and source provenance","Compare outputs to known reference when possible","Missing head surfaces and uncertainty explicitly identified"],limitations:"Not implemented; single-image landmarks are not a head scan."},
  {id:"M5",title:"Blender & Game Export",state:"planned",summary:"GLB/VRM for rigging and animation; OBJ for static geometry; watertight STL pipeline for optional prints.",acceptance:["Open rigged model in Blender and Unity","Verify expression mapping on imported avatar","Validate scale, manifold geometry and printability before STL release"],limitations:"Not implemented."},
  {id:"M6",title:"Advanced Avatar FX",state:"planned",summary:"Audio-driven speech, body and hands, optional model comparison, and reusable WebForge FX integration.",acceptance:["Independent adapter and model boundaries","Document latency/quality tradeoffs and privacy","No undocumented replacement of model results"],limitations:"Research direction only."}
]);
export const testSuites = Object.freeze([
 {id:"tracking",title:"Tracking",cases:[
  {id:"portrait-alignment",title:"Portrait landmark alignment",readiness:"available",details:"Upload an image, analyze it, and inspect facial landmark placement and the official connections.",criteria:"Visual alignment with eye, mouth and nose features; no synthetic replacement; note photo and browser."},
  {id:"mobile-orbit",title:"Inspector touch and zoom",readiness:"available",details:"Try touch orbit, yaw/pitch sliders, mesh/contour modes and reset on a real phone.",criteria:"No page scrolling while dragging mesh, no horizontal overflow, consistent reset and stable portrait overlay."},
  {id:"live-webcam",title:"Live webcam stability",readiness:"future",details:"Use opt-in camera capture and compare head motion, blink and expression response when M1 exists.",criteria:"Camera stops correctly; tracking loss is reported; record measured frame rate and latency."}
 ]},
 {id:"reconstruction",title:"Reconstruction",cases:[
  {id:"relative-vs-depth",title:"Depth provenance",readiness:"future",details:"Compare landmarks-only view with a separate depth-model result, when implemented.",criteria:"Relative depth is never labeled metric; each inference has model/version and its own status."},
  {id:"multi-view",title:"Multi-angle scan",readiness:"future",details:"Compare image sets and short videos with a reference head shape when available.",criteria:"Log pose coverage, missing areas, alignment quality and independently measured error when ground truth exists."}
 ]},
 {id:"animation",title:"Animation",cases:[
  {id:"expression-mapping",title:"Expression → avatar rig",readiness:"future",details:"Drive a licensed rig with smile, blink, jaw-open and eyebrow motion.",criteria:"Compare source signal with visible output; verify calibration, neutrality and loss-of-tracking response."},
  {id:"record-replay",title:"Motion record and replay",readiness:"future",details:"Record an opt-in expression sequence then play it back on the same avatar.",criteria:"Repeatable expression curve and head pose; no private camera frames persisted."}
 ]},
 {id:"export",title:"Export",cases:[
  {id:"landmarks-json",title:"Landmarks JSON",readiness:"available",details:"Export current normalized landmark data from Portrait Lab.",criteria:"JSON includes schema, numerical points, blendshapes and provenance; no fabricated depth data."},
  {id:"glb-vrm",title:"Rigged model import",readiness:"future",details:"Import the same avatar asset in Blender and Unity once the exporter exists.",criteria:"Animation targets, material mapping and rig compatibility verified in both tools."},
  {id:"print-mesh",title:"Print-safe mesh",readiness:"future",details:"Check generated head geometry in a 3D mesh checker before slicing.",criteria:"Watertight mesh, defined units, thickness, orientation and support requirements verified."}
 ]}
]);
