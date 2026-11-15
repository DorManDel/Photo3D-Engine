import { normalizeFaceTopology } from "./geometry/face-topology.js";

/** Provider-independent landmark output. Optional topology is additive to v1. */
export const LANDMARK_SCHEMA = "photo3d.landmarks.v1";

export function normalizeFaceResult(result, provider = "mediapipe-face-landmarker", model = "face_landmarker/float16/1", topology = null) {
  const face = result?.faceLandmarks?.[0];
  if (!Array.isArray(face) || !face.length) throw new Error("No face detected. Try a clear, front-facing portrait.");
  const landmarks = face.map((point, index) => {
    const x = Number(point.x), y = Number(point.y), z = Number(point.z);
    if (![x, y, z].every(Number.isFinite)) throw new Error("Model returned invalid landmark coordinates.");
    return { index, x, y, z };
  });
  const blendshapes = (result?.faceBlendshapes?.[0]?.categories || []).map((c) => ({
    name: String(c.categoryName || ""), score: Number(c.score) || 0
  }));
  return {
    schema: LANDMARK_SCHEMA,
    kind: "landmarks",
    provenance: { provider, model, coordinates: "image-normalized-x-y, relative-z", inference: "on-device" },
    landmarks,
    blendshapes,
    topology: normalizeFaceTopology(topology, landmarks.length)
  };
}
