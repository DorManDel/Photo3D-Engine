/**
 * Product/experiment manifest, not an installed-model registry.
 * "research" NEVER implies a working inference endpoint.
 * Provider licenses and model assets must be reviewed before any integration.
 */
export const PROVIDERS = Object.freeze([
  {
    id:"mediapipe",
    name:"MediaPipe Face Landmarker",
    purpose:"Fast facial landmarks, expressions and relative face topology",
    input:"1 portrait",
    output:"Landmarks + relative-Z topology",
    runtime:"Browser (implemented in Photo Lab)",
    status:"integrated",
    licensing:"Third-party Google runtime/model; review notice and distribution terms",
    source:"https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker",
    strength:"On-device inspection and later tracking",
    limit:"Not a full head or identity-preserving reconstruction"
  },
  {
    id:"mica",
    name:"MICA",
    purpose:"Estimate identity-focused metric face shape from photo(s)",
    input:"1+ face images (research workflow)",
    output:"FLAME parameters + face mesh (research implementation)",
    runtime:"Offline research runner code + real OBJ web importer available; licensed Python/CUDA model assets NOT installed",
    status:"research",
    licensing:"Non-commercial scientific/research/education terms; FLAME model access required",
    source:"https://github.com/Zielon/MICA",
    strength:"Stable identity geometry to compare with our partial face mesh",
    limit:"Does not automatically create hair, clothing or a rigged full body"
  },
  {
    id:"deca",
    name:"DECA",
    purpose:"Recover detailed face geometry and expression parameters",
    input:"1 face image",
    output:"Animatable detailed face model (research implementation)",
    runtime:"Separate Python/GPU adapter — not installed",
    status:"research",
    licensing:"Non-commercial scientific-research license; FLAME/other assets may be gated",
    source:"https://github.com/yfeng95/DECA",
    strength:"Expression-aware face geometry and future rig experiments",
    limit:"Not a drop-in commercial avatar pipeline"
  },
  {
    id:"sam3dbody",
    name:"SAM 3D Body",
    purpose:"Estimate full-body human mesh, pose and structure",
    input:"1 full-body image",
    output:"Body mesh + pose using Momentum Human Rig",
    runtime:"Separate model service/GPU — not installed",
    status:"research",
    licensing:"SAM License; obtain model checkpoints and review terms",
    source:"https://github.com/facebookresearch/sam-3d-body",
    strength:"Future body reconstruction and skeletal structure",
    limit:"Body estimation is not measured anatomy or automatic production-ready clothing/rig"
  }
]);
export function getProvider(id){
  return PROVIDERS.find(p=>p.id===id) || null;
}
export function providerIsRunnableHere(id){
  // Photo Lab is the only implemented inference path. This studio has no run endpoint.
  return id==="mediapipe";
}
