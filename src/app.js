import { analyzeFace } from "./models/mediapipe.js";
import { paintPortrait, paintLandmarks } from "./visualization.js";
import { drawFaceReference } from "./visualization/face-reference.js";

const $ = id => document.getElementById(id);
const nodes = { upload: $("upload"), sample: $("sample"), analyze: $("analyze"), export: $("export"),
  portrait: $("portrait"), cloud: $("cloud"), status: $("status"),
  stage: $("inspectorStage"), mesh3d: $("mesh3d"), reference: $("referenceCompare"),
  referenceCrop: $("referenceCrop"), exportPng: $("exportPng"), depth: $("depth"), warning: $("angleWarning"),
  overlay: $("landmarks"), portraitMesh: $("portraitMesh"), yaw: $("yaw"), pitch: $("pitch"), zoom: $("zoom"), mode: $("inspectorMode"), resetView: $("resetView"), meshStats: $("meshStats"),
  provenance: $("provenance"), portraitEmpty: $("portrait-empty"), cloudEmpty: $("cloud-empty") };
let image = null, objectUrl = null, result = null, busy = false, imageRequestId = 0;
let texturedViewer = null, texturedLoading = null, texturedInfo = null, viewerGeneration = 0;
const isTexturedMode = () => nodes.mode.value === "texture" || nodes.mode.value === "texture-wireframe";
function viewerSettings() {
  return {
    yaw: Number(nodes.yaw.value), pitch: Number(nodes.pitch.value),
    zoom: Number(nodes.zoom.value), depthStrength: Number(nodes.depth.value),
    wireframe: nodes.mode.value === "texture-wireframe"
  };
}
function disposeViewer(){
  viewerGeneration++;
  const old=texturedViewer; texturedViewer=null; texturedLoading=null; texturedInfo=null;
  old?.dispose();
  nodes.mesh3d.dataset.state="disposed";
  nodes.exportPng.disabled=true;
}
async function ensureTexturedViewer(){
  if(texturedViewer || texturedLoading || !result || !image || !isTexturedMode())return;
  const version=++viewerGeneration;
  const activeImage=image, activeResult=result;
  nodes.mesh3d.dataset.state="loading-module:"+version;
  nodes.exportPng.disabled=true;
  nodes.meshStats.textContent="Loading Three.js textured mesh…";
  texturedLoading=(async()=>{
    const {createTexturedViewer}=await import("./renderers/three-textured.js");
    nodes.mesh3d.dataset.state="module-loaded:"+version;
    if(version!==viewerGeneration || !isTexturedMode() || result!==activeResult) return;
    nodes.mesh3d.dataset.state="creating-webgl:"+version;
    const candidate=await createTexturedViewer(nodes.mesh3d);
    nodes.mesh3d.dataset.state="webgl-created:"+version;
    if(version!==viewerGeneration || !isTexturedMode() || result!==activeResult){
      candidate.dispose();return;
    }
    try{
      nodes.mesh3d.dataset.state="building-mesh:"+version;
      const model=candidate.setModel(activeImage,activeResult);
      nodes.mesh3d.dataset.state="mesh-ready:"+version;
      texturedInfo=model;
      texturedViewer=candidate;
      texturedViewer.setView(viewerSettings());
      nodes.meshStats.textContent=model.triangles+" textured triangles · "+model.textureWidth+"×"+model.textureHeight+" px";
      nodes.exportPng.disabled=false;
    }catch(error){candidate.dispose();throw error;}
  })();
  try {await texturedLoading;}
  catch(error){
    if(version===viewerGeneration){
      nodes.mode.value="wireframe";
      nodes.exportPng.disabled=true;
      nodes.mesh3d.dataset.state="failed:"+version;
      status("Textured mode unavailable: "+(error?.message||String(error))+". Wireframe remains usable.");
      redraw();
    }
  }finally{
    if(version===viewerGeneration)texturedLoading=null;
  }
}


function status(message) { nodes.status.textContent = message; }
function redraw(){
  const textured=isTexturedMode() && !!result && !!image;
  paintPortrait(nodes.portrait,image,result,nodes.overlay.checked,nodes.portraitMesh.checked);
  if(!textured)paintLandmarks(nodes.cloud,result,Number(nodes.yaw.value),Number(nodes.pitch.value),{
    mode:nodes.mode.value,zoom:Number(nodes.zoom.value)
  });
  nodes.cloud.hidden=textured;
  nodes.mesh3d.hidden=!textured;
  nodes.reference.hidden=!textured;
  nodes.warning.hidden=!textured || Math.abs(Number(nodes.yaw.value))<43;
  if(textured){
    drawFaceReference(nodes.referenceCrop,image,result);
    if(texturedViewer)texturedViewer.setView(viewerSettings());
    else void ensureTexturedViewer();
  }
  nodes.exportPng.disabled=!(textured && texturedViewer);
  $("yawValue").textContent=nodes.yaw.value+"°";
  $("pitchValue").textContent=nodes.pitch.value+"°";
  $("zoomValue").textContent=Number(nodes.zoom.value).toFixed(1)+"×";
  $("depthValue").textContent=Number(nodes.depth.value).toFixed(1)+"×";
  if(textured && texturedViewer && texturedInfo){
    nodes.meshStats.textContent=texturedInfo.triangles+" textured triangles · "+
      texturedInfo.textureWidth+"×"+texturedInfo.textureHeight+" px";
  }else{
    nodes.meshStats.textContent=result
      ? result.landmarks.length+" points · "+(result.topology?.triangles?.length||0)+" official triangles"
      : "Analyze to inspect mesh";
  }
  nodes.portraitEmpty.hidden=!!image;
  nodes.cloudEmpty.hidden=!!result;
}

function resetAnalysis() {
  disposeViewer();
  result = null;
  nodes.export.disabled = true;
  nodes.provenance.textContent = "NO MODEL OUTPUT";
  redraw();
}
async function setImage(file) {
  if (!file) return;
  const requestId = ++imageRequestId;
  // Revoke only after a successful replacement, so the currently displayed photo remains usable.
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    status("Choose a PNG/JPEG/WebP under 12 MB."); nodes.upload.value = ""; return;
  }
  const nextUrl = URL.createObjectURL(file);
  const next = new Image(); next.decoding = "async";
  try {
    next.src = nextUrl;
    await next.decode();
    if (requestId !== imageRequestId) { URL.revokeObjectURL(nextUrl); return; }
    if (next.naturalWidth * next.naturalHeight > 24_000_000) {
      throw Error("Image resolution too large (max 24 MP).");
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = nextUrl;
    image = next;
    resetAnalysis();
    nodes.analyze.disabled = busy;
    status("Portrait loaded. Click Analyze to load the real face model.");
  } catch (error) {
    URL.revokeObjectURL(nextUrl);
    if (requestId === imageRequestId) status(error.message || "Could not decode that image.");
  }
}
// Optional quick-start image from user's public portfolio, never bundled or cached by this app.
const PUBLIC_SAMPLE = "https://raw.githubusercontent.com/DorManDel/Dor-s-Profile-Site/main/images/profile_pic.jpg";
nodes.sample.addEventListener("click", async () => {
  nodes.sample.disabled = true;
  const requested = ++imageRequestId; // invalidate work on an earlier selection
  status("Loading public portfolio sample…");
  try {
    const response = await fetch(PUBLIC_SAMPLE, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const photoBlob = await response.blob();
    if (requested !== imageRequestId) return;
    const sampleFile = new File([photoBlob], "portfolio-sample.jpg", { type: "image/jpeg" });
    await setImage(sampleFile);
  } catch (error) {
    if (requested === imageRequestId) status("Could not load portfolio sample (" + error.message + "). Upload a local photo instead.");
  } finally { nodes.sample.disabled = false; }
});
nodes.upload.addEventListener("change", e => setImage(e.target.files?.[0]));
nodes.analyze.addEventListener("click", async () => {
  if (!image || busy) return;
  busy = true; nodes.analyze.disabled = true; nodes.export.disabled = true;
  const analyzingImage = image, imageGeneration = imageRequestId;
  result = null; nodes.provenance.textContent = "ANALYZING";
  status("Loading MediaPipe runtime/model (first use may be slow)…");
  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const output = await analyzeFace(analyzingImage);
    if (imageGeneration !== imageRequestId) {
      status("Portrait changed during analysis. Analyze the new photo.");
      return;
    }
    result = output;
    nodes.provenance.textContent = "MEDIAPIPE · REAL OUTPUT";
    nodes.export.disabled = false;
    status("Detected " + result.landmarks.length + " real landmarks. Rotate the inspector with the sliders.");
  } catch (error) {
    if (imageGeneration === imageRequestId) {
      result = null; nodes.provenance.textContent = "ANALYSIS FAILED";
      status("Analysis failed: " + (error?.message || String(error)) + ". Check model downloads/browser support.");
    }
  } finally { busy = false; nodes.analyze.disabled = !image; redraw(); }
});
nodes.export.addEventListener("click", () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:"application/json"}));
  const a = document.createElement("a");a.href = url;a.download = "photo3d-landmarks.json";a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
for(const input of [nodes.overlay,nodes.portraitMesh,nodes.yaw,nodes.pitch,nodes.zoom,nodes.depth,nodes.mode]){
  input.addEventListener("input",redraw);
}
nodes.resetView.addEventListener("click",()=>{
  nodes.yaw.value="0";nodes.pitch.value="0";nodes.zoom.value="1";nodes.depth.value="1";
  redraw();
});
nodes.exportPng.addEventListener("click",async()=>{
  if(!texturedViewer || !isTexturedMode())return;
  nodes.exportPng.disabled=true;
  try{
    const png=await texturedViewer.screenshot();
    const url=URL.createObjectURL(png);
    const link=document.createElement("a");link.href=url;link.download="photo3d-textured-mesh.png";
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    status("Textured mesh PNG saved. The background is transparent.");
  }catch(error){status("Could not export mesh PNG: "+(error.message||String(error)));}
  finally{nodes.exportPng.disabled=!texturedViewer || !isTexturedMode();}
});
const activePointers=new Map();
let lastPinch=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=()=>{
  const [a,b]=[...activePointers.values()];
  return a && b ? Math.hypot(b.x-a.x,b.y-a.y):null;
};
nodes.stage.addEventListener("pointerdown",event=>{
  if(!result)return;
  if(event.target.closest?.(".reference-compare"))return;
  activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  nodes.stage.setPointerCapture(event.pointerId);
  lastPinch=activePointers.size>=2?distance():null;
});
nodes.stage.addEventListener("pointermove",event=>{
  if(!activePointers.has(event.pointerId))return;
  const previous=activePointers.get(event.pointerId);
  activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(activePointers.size>=2){
    const current=distance();
    if(lastPinch && current && current>0){
      nodes.zoom.value=String(clamp(Number(nodes.zoom.value)*current/lastPinch,.6,2.2));
    }
    lastPinch=current;
  }else{
    const box=nodes.stage.getBoundingClientRect();
    const dx=(event.clientX-previous.x)/Math.max(1,box.width);
    const dy=(event.clientY-previous.y)/Math.max(1,box.height);
    nodes.yaw.value=String(clamp(Number(nodes.yaw.value)+160*dx,-70,70));
    nodes.pitch.value=String(clamp(Number(nodes.pitch.value)-110*dy,-50,50));
  }
  redraw();
});
function releasePointer(event){
  activePointers.delete(event.pointerId);
  lastPinch=activePointers.size>=2?distance():null;
}
nodes.stage.addEventListener("pointerup",releasePointer);
nodes.stage.addEventListener("pointercancel",releasePointer);
nodes.stage.addEventListener("lostpointercapture",releasePointer);
addEventListener("pagehide",()=>{
  disposeViewer();
  if(objectUrl)URL.revokeObjectURL(objectUrl);
});
redraw();

// Safe development diagnostics: stage only, no user image data or landmark data exposed.
window.photo3dStatus=()=>({stage:nodes.mesh3d.dataset.state||"idle",generation:viewerGeneration,loading:!!texturedLoading,ready:!!texturedViewer,mode:nodes.mode.value});
