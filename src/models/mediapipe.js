import { normalizeFaceResult } from "../contracts.js";

/** Real on-device landmark detector; lazy loads pinned official runtime and model. */
const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
let detectorPromise;

async function createDetector() {
  const { FilesetResolver, FaceLandmarker } = await import(VISION_URL);
  const wasm = await FilesetResolver.forVisionTasks(WASM_URL);
  return FaceLandmarker.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    runningMode: "IMAGE", numFaces: 1, outputFaceBlendshapes: true
  });
}

export async function analyzeFace(image) {
  detectorPromise ||= createDetector().catch((error) => { detectorPromise = null; throw error; });
  const detector = await detectorPromise;
  return normalizeFaceResult(detector.detect(image), "mediapipe-face-landmarker@0.10.35", "face_landmarker/float16/1");
}

export const providerInfo = Object.freeze({ id: "mediapipe-face-landmarker", version: "0.10.35", onDevice: true });
