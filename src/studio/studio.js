import { PROVIDERS, getProvider } from "./model-catalog.js";
import { CAPTURE_SLOTS, validateCaptureFile, evaluateCapture, buildCapturePlan } from "./capture.js";

const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll("[data-view-target]")];
const validViews=new Set(tabs.map(tab=>tab.dataset.viewTarget));
let activeView="lab",selectedProvider="mica";
const captures=Object.create(null);
const generations=Object.create(null);
const urls=Object.create(null);

function viewFromHash(){
  const view=location.hash.replace(/^#\/?/,"").trim();
  return validViews.has(view)?view:"lab";
}
function activateView(view){
  const safe=validViews.has(view)?view:"lab";
  activeView=safe;
  for(const tab of tabs){
    const selected=tab.dataset.viewTarget===safe;
    tab.setAttribute("aria-selected",String(selected));
    tab.tabIndex=selected?0:-1;
    const panel=$(tab.getAttribute("aria-controls"));
    if(panel)panel.hidden=!selected;
  }
}
function navigate(view,{focus=false}={}){
  if(!validViews.has(view))return;
  if(location.hash!=="#"+view)location.hash=view;
  else activateView(view);
  if(focus)tabs.find(t=>t.dataset.viewTarget===view)?.focus();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener("click",()=>navigate(tab.dataset.viewTarget));
  tab.addEventListener("keydown",event=>{
    let next=null;
    if(event.key==="ArrowRight")next=(index+1)%tabs.length;
    if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;
    if(event.key==="Home")next=0;
    if(event.key==="End")next=tabs.length-1;
    if(next!==null){event.preventDefault();navigate(tabs[next].dataset.viewTarget,{focus:true});}
  });
});
addEventListener("hashchange",()=>activateView(viewFromHash()));
activateView(viewFromHash());

function textRow(label,value){
  const div=document.createElement("div");
  div.className="provider-row";
  const dt=document.createElement("strong"),dd=document.createElement("span");
  dt.textContent=label;dd.textContent=value;div.append(dt,dd);
  return div;
}
function showProvider(id){
  const p=getProvider(id);
  if(!p)return;
  selectedProvider=id;
  for(const button of document.querySelectorAll("[data-provider]")){
    button.setAttribute("aria-pressed",String(button.dataset.provider===id));
  }
  const area=$("provider-detail");const title=document.createElement("h4");
  title.textContent=p.name;
  const badge=document.createElement("span");
  badge.className="status-chip "+(p.status==="integrated"?"state-ready":"state-research");
  badge.textContent=p.status==="integrated"?"PHOTO LAB BASELINE":"RESEARCH CANDIDATE";
  const top=document.createElement("div");
  top.className="provider-title";top.append(title,badge);
  const desc=document.createElement("p");desc.textContent=p.purpose;
  const details=[
    textRow("Input",p.input),textRow("Output",p.output),textRow("Runtime",p.runtime),
    textRow("Strength",p.strength),textRow("Limit",p.limit),textRow("License / terms",p.licensing)
  ];
  const anchor=document.createElement("a");
  anchor.href=p.source;anchor.target="_blank";anchor.rel="noopener noreferrer";
  anchor.textContent="Official model documentation ↗";
  const footer=document.createElement("p");
  footer.className="provider-footnote";
  footer.textContent="Selecting this provider does not run or download a model.";
  area.replaceChildren(top,desc,...details,anchor,footer);
}
for(const button of document.querySelectorAll("[data-provider]")){
  button.addEventListener("click",()=>showProvider(button.dataset.provider));
}
showProvider(selectedProvider);

function updateCaptureStatus(message=null){
  const report=evaluateCapture(captures);
  $("capture-status").textContent=message||report.imageCount+" / 4 reference photos · "+report.message;
  $("download-capture-plan").disabled=!report.readyForSingleImageResearch;
}
function showCapture(slot,file,src,width,height){
  const preview=$("preview-"+slot),label=$("meta-"+slot);
  preview.src=src;preview.hidden=false;
  label.textContent=width+" × "+height+" px · "+(file.size/(1024*1024)).toFixed(1)+" MB";
}
async function assignCapture(slot,file){
  generations[slot]=(generations[slot]||0)+1;
  const request=generations[slot];
  const error=validateCaptureFile(file);
  if(error){updateCaptureStatus(slot+": "+error);return;}
  const url=URL.createObjectURL(file);
  const image=new Image();
  image.decoding="async";
  try{
    image.src=url;await image.decode();
    if(request!==generations[slot]){URL.revokeObjectURL(url);return;}
    const width=image.naturalWidth,height=image.naturalHeight;
    if(!width||!height||width*height>24_000_000)throw Error("Image must be under 24 MP.");
    if(urls[slot])URL.revokeObjectURL(urls[slot]);
    urls[slot]=url;
    captures[slot]={width,height,size:file.size,type:file.type};
    showCapture(slot,file,url,width,height);
    updateCaptureStatus();
  }catch(e){
    URL.revokeObjectURL(url);
    if(request===generations[slot])updateCaptureStatus(slot+": "+(e?.message||"Image cannot be opened."));
  }
}
for(const slot of CAPTURE_SLOTS){
  $("capture-"+slot.id).addEventListener("change",event=>{
    const file=event.target.files?.[0];
    if(file)void assignCapture(slot.id,file);
  });
}
function clearCaptures(){
  for(const slot of CAPTURE_SLOTS){
    const key=slot.id;
    generations[key]=(generations[key]||0)+1;
    if(urls[key])URL.revokeObjectURL(urls[key]);
    delete urls[key];delete captures[key];
    const img=$("preview-"+key);
    img.removeAttribute("src");img.hidden=true;
    $("capture-"+key).value="";
    $("meta-"+key).textContent=key==="front"?"No photo selected":"Optional reference";
  }
  $("capture-height").value="";
  updateCaptureStatus("Photos cleared. No data was uploaded.");
}
$("clear-captures").addEventListener("click",clearCaptures);
$("download-capture-plan").addEventListener("click",()=>{
  try{
    const value=$("capture-height").value;
    const plan=buildCapturePlan(captures,{selectedProvider,heightCm:value});
    const url=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)],{type:"application/json"}));
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="photo3d-capture-plan.json";
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    updateCaptureStatus("Saved capture metadata only. Model inference has NOT run.");
  }catch(error){updateCaptureStatus(error.message);}
});
addEventListener("pagehide",()=>{
  for(const url of Object.values(urls))URL.revokeObjectURL(url);
});
// Non-sensitive diagnostics only. No filenames, image bytes or faces.
window.photo3dStudioStatus=()=>({
  activeView,selectedProvider,
  imageSlots:CAPTURE_SLOTS.filter(slot=>Boolean(captures[slot.id])).map(slot=>slot.id),
  inferenceExecuted:false
});
