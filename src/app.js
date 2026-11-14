import { analyzeFace } from "./models/mediapipe.js";
import { paintPortrait, paintLandmarks } from "./visualization.js";

const $ = id => document.getElementById(id);
const nodes = { upload: $("upload"), analyze: $("analyze"), export: $("export"),
  portrait: $("portrait"), cloud: $("cloud"), status: $("status"),
  overlay: $("landmarks"), yaw: $("yaw"), pitch: $("pitch"),
  provenance: $("provenance"), portraitEmpty: $("portrait-empty"), cloudEmpty: $("cloud-empty") };
let image = null, objectUrl = null, result = null, busy = false;

function status(message) { nodes.status.textContent = message; }
function redraw() {
  paintPortrait(nodes.portrait, image, result, nodes.overlay.checked);
  paintLandmarks(nodes.cloud, result, Number(nodes.yaw.value), Number(nodes.pitch.value));
  $("yawValue").textContent = nodes.yaw.value + "°";
  $("pitchValue").textContent = nodes.pitch.value + "°";
  nodes.portraitEmpty.hidden = !!image;
  nodes.cloudEmpty.hidden = !!result;
}
function resetAnalysis() {
  result = null;
  nodes.export.disabled = true;
  nodes.provenance.textContent = "NO MODEL OUTPUT";
  redraw();
}
async function setImage(file) {
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    status("Choose a PNG/JPEG/WebP under 12 MB.");nodes.upload.value = "";return;
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  const next = new Image();next.decoding = "async";
  try { next.src = objectUrl;await next.decode();image = next;resetAnalysis();nodes.analyze.disabled = false;status("Portrait loaded. Click Analyze to load the real face model."); }
  catch { image = null;resetAnalysis();nodes.analyze.disabled = true;status("Could not decode that image."); }
}
nodes.upload.addEventListener("change", e => setImage(e.target.files?.[0]));
nodes.analyze.addEventListener("click", async () => {
  if (!image || busy) return;
  busy = true;nodes.analyze.disabled = true;nodes.export.disabled = true;
  status("Loading MediaPipe runtime/model (first use may be slow)…");
  try {
    // Give status text one chance to paint before synchronous inference starts.
    await new Promise(resolve => requestAnimationFrame(resolve));
    result = await analyzeFace(image);
    nodes.provenance.textContent = "MEDIAPIPE · REAL OUTPUT";
    nodes.export.disabled = false;
    status("Detected " + result.landmarks.length + " real landmarks. Rotate the inspector with the sliders.");
  } catch (error) {
    result = null;nodes.provenance.textContent = "ANALYSIS FAILED";
    status("Analysis failed: " + (error?.message || String(error)) + ". Check model downloads/browser support.");
  } finally { busy = false;nodes.analyze.disabled = !image;redraw(); }
});
nodes.export.addEventListener("click", () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:"application/json"}));
  const a = document.createElement("a");a.href = url;a.download = "photo3d-landmarks.json";a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
for (const input of [nodes.overlay,nodes.yaw,nodes.pitch]) input.addEventListener("input",redraw);
addEventListener("pagehide", () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
redraw();
