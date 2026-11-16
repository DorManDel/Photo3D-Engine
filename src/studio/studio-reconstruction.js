/** UI controller only. Inference/geometry and export remain swappable adapters. */
export function setupReconstructionBaseline({getFrontImageUrl,getReferenceCount}){
  const $=id=>document.getElementById(id);
  const run=$("run-baseline"),download=$("download-baseline-glb"),resetButton=$("reset-baseline");
  const pane=$("baseline-result"),viewerRoot=$("baseline-viewer"),metrics=$("baseline-metrics");
  const status=$("baseline-status");
  const controls={yaw:$("baseline-yaw"),pitch:$("baseline-pitch"),zoom:$("baseline-zoom"),wire:$("baseline-wire")};
  let viewer=null,baseline=null,running=false,exporting=false,serial=0,state="idle";
  const steps=["input","model","mesh","render","export"];
  function progress(step,phase){
    const limit=steps.indexOf(step);
    for(const [i,key] of steps.entries()){
      const node=document.querySelector('[data-pipeline-step="'+key+'"]');
      node?.classList.toggle("is-complete",i<limit||(i===limit&&phase==="complete"));
      node?.classList.toggle("is-active",i===limit&&phase==="active");
    }
  }
  function setStatus(message,next){
    status.textContent=message;
    if(next)state=next;
  }
  function setView(){
    if(!viewer)return;
    viewer.setView({
      yaw:Number(controls.yaw.value),pitch:Number(controls.pitch.value),
      zoom:Number(controls.zoom.value),wireframe:controls.wire.checked,
      wireStyle:"surface",depthStrength:1
    });
  }
  for(const item of Object.values(controls))item.addEventListener("input",setView);
  // Gesture behavior mirrors the original Photo Lab; no continuous render loop.
  const touches=new Map();
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const pinch=()=>{
    const [a,b]=[...touches.values()];
    return a&&b?Math.hypot(b.x-a.x,b.y-a.y):null;
  };
  let lastPinch=null;
  viewerRoot.addEventListener("pointerdown",event=>{
    if(!viewer)return;
    touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    viewerRoot.setPointerCapture(event.pointerId);
    lastPinch=touches.size>1?pinch():null;
  });
  viewerRoot.addEventListener("pointermove",event=>{
    if(!touches.has(event.pointerId)||!viewer)return;
    const old=touches.get(event.pointerId);
    touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(touches.size>=2){
      const d=pinch();
      if(d && lastPinch){
        controls.zoom.value=String(clamp(Number(controls.zoom.value)*d/lastPinch,.6,2.2));
      }
      lastPinch=d;
    }else{
      const rect=viewerRoot.getBoundingClientRect();
      controls.yaw.value=String(clamp(Number(controls.yaw.value)+160*(event.clientX-old.x)/Math.max(1,rect.width),-65,65));
      controls.pitch.value=String(clamp(Number(controls.pitch.value)-100*(event.clientY-old.y)/Math.max(1,rect.height),-40,40));
    }
    setView();
  });
  function stopPointer(event){touches.delete(event.pointerId);lastPinch=touches.size>1?pinch():null;}
  for(const event of ["pointerup","pointercancel","lostpointercapture"])viewerRoot.addEventListener(event,stopPointer);
  viewerRoot.addEventListener("wheel",event=>{
    if(!viewer)return;
    event.preventDefault();
    controls.zoom.value=String(clamp(Number(controls.zoom.value)+(event.deltaY>0?-.1:.1),.6,2.2));
    setView();
  },{passive:false});
  function reportRow(label,text){
    const row=document.createElement("div");row.className="metric-row";
    const name=document.createElement("strong"),value=document.createElement("span");
    name.textContent=label;value.textContent=String(text);row.append(name,value);
    return row;
  }
  function updateReport(data,elapsedMs){
    metrics.replaceChildren(
      reportRow("Provider", "MediaPipe Face Landmarker · on-device"),
      reportRow("Input used", "1 front reference (additional views NOT fused)"),
      reportRow("Landmarks",data.result.landmarks.length),
      reportRow("Mesh triangles",data.surface.triangleCount),
      reportRow("Open boundaries",data.audit.boundaryEdgeCount+" edges / "+data.audit.boundaryComponents+" components"),
      reportRow("Relative depth","MediaPipe Z · not measured in cm"),
      reportRow("Analysis elapsed",Math.round(elapsedMs)+" ms · includes first model load"),
      reportRow("Asset kind","Textured partial-face 2.5D · no rig")
    );
  }
  function onInputChanged(){
    const front=Boolean(getFrontImageUrl());
    run.disabled=!front||running||exporting;
    if(!front&&!baseline&&!running)setStatus("Choose a Front photograph to enable real inference.","idle");
  }
  function reset(){
    serial++;
    viewer?.dispose();viewer=null;baseline=null;
    touches.clear();lastPinch=null;
    running=false;exporting=false;pane.hidden=true;
    metrics.replaceChildren();viewerRoot.replaceChildren();
    controls.yaw.value="0";controls.pitch.value="0";controls.zoom.value="1";controls.wire.checked=false;
    run.disabled=!getFrontImageUrl();download.disabled=true;
    for(const key of steps){
      const n=document.querySelector('[data-pipeline-step="'+key+'"]');
      n?.classList.remove("is-active","is-complete");
    }
    setStatus(getFrontImageUrl()
      ?"Ready: the Front photograph can be processed locally. Choose Generate."
      :"Choose a Front photograph to enable real inference.","idle");
  }
  async function runBaseline(){
    const url=getFrontImageUrl();
    if(!url||running||exporting)return;
    const generation=++serial;running=true;run.disabled=true;download.disabled=true;
    viewer?.dispose();viewer=null;baseline=null;pane.hidden=true;viewerRoot.replaceChildren();
    const count=getReferenceCount();
    progress("input","complete");
    setStatus("Loading the decoded front photo (only this photo is used for geometry)…","loading");
    try{
      const image=new Image();image.src=url;await image.decode();
      if(generation!==serial)return;
      progress("model","active");
      setStatus("Running the real MediaPipe face model on-device…","inferring");
      const {reconstructBaseline}=await import("./reconstruction-baseline.js");
      const started=performance.now();
      const produced=await reconstructBaseline(image);
      if(generation!==serial)return;
      const elapsed=performance.now()-started;
      progress("model","complete");progress("mesh","complete");progress("render","active");
      pane.hidden=false;
      setStatus("Model returned real landmarks. Creating a GPU texture and 3D face surface…","rendering");
      const {createTexturedViewer}=await import("../renderers/three-textured.js");
      const candidate=await createTexturedViewer(viewerRoot);
      if(generation!==serial){candidate.dispose();return;}
      try{
        candidate.setModel(image,produced.result);
        viewer=candidate;
        baseline=produced;
        setView();updateReport(produced,elapsed);
        progress("render","complete");
        setStatus("REAL RESULT: "+produced.surface.triangleCount+" official triangles; "+produced.audit.boundaryEdgeCount+" open edges. "+(count>1?"Extra views are NOT fused. ":"")+"Export GLB to inspect in Blender.","ready");
        download.disabled=false;
      }catch(e){candidate.dispose();throw e;}
    }catch(error){
      if(generation===serial){
        viewer?.dispose();viewer=null;baseline=null;pane.hidden=true;
        setStatus("Baseline failed: "+(error?.message||String(error))+". Check model downloads / WebGL.","error");
      }
    }finally{
      if(generation===serial){running=false;run.disabled=!getFrontImageUrl();}
    }
  }
  async function exportGlb(){
    if(!baseline||exporting||running)return;
    const current=baseline,generation=serial;
    exporting=true;run.disabled=true;download.disabled=true;
    progress("export","active");
    setStatus("Serializing REAL indexed face geometry + source image texture into GLB…","exporting");
    try{
      const {exportBaselineGlb}=await import("./reconstruction-baseline.js");
      const bytes=await exportBaselineGlb(current,{maxTextureSize:1024});
      if(generation!==serial)return;
      const objectUrl=URL.createObjectURL(new Blob([bytes],{type:"model/gltf-binary"}));
      const link=document.createElement("a");
      link.href=objectUrl;link.download="photo3d-mediapipe-partial-face.glb";
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
      progress("export","complete");
      setStatus("GLB saved ("+Math.round(bytes.byteLength/1024)+" KiB). Contains photo pixels; keep it private. This is a partial face, NOT a full-head/rigged avatar.","exported");
    }catch(error){
      if(generation===serial){
        progress("export","active");
        setStatus("GLB export failed: "+(error?.message||String(error)),"error");
      }
    }finally{
      if(generation===serial){
        exporting=false;download.disabled=!baseline;run.disabled=!getFrontImageUrl();
      }
    }
  }
  run.addEventListener("click",()=>void runBaseline());
  download.addEventListener("click",()=>void exportGlb());
  resetButton.addEventListener("click",reset);
  addEventListener("pagehide",reset);
  onInputChanged();
  return {
    reset,onInputChanged,
    status:()=>({
      state,ready:Boolean(baseline),running,exporting,
      triangleCount:baseline?.surface.triangleCount??0,
      viewsUsed:baseline?.viewsUsed??[],
      gpuReady:viewer?.diagnostics().ready??false
    })
  };
}
