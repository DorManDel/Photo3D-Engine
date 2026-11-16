/** Private, browser-only capture preparation. This module never reads image pixels. */
export const CAPTURE_SCHEMA="photo3d.capture-plan.v1";
export const CAPTURE_SLOTS=Object.freeze([
  {id:"front",label:"Front",hint:"Face visible; neutral expression; no harsh shadows"},
  {id:"left",label:"Left ¾",hint:"Turn your head about 30–45° left"},
  {id:"right",label:"Right ¾",hint:"Turn your head about 30–45° right"},
  {id:"profile",label:"Profile",hint:"Optional side profile for studying unseen geometry"}
]);
export function validateCaptureFile(file){
  if(!file || !["image/png","image/jpeg","image/webp"].includes(file.type)){
    return "Use a PNG, JPEG or WebP photograph.";
  }
  if(file.size<=0 || file.size>12*1024*1024){
    return "Each image must be nonempty and below 12 MB.";
  }
  return null;
}
export function evaluateCapture(slots){
  const present=CAPTURE_SLOTS.filter(s=>Boolean(slots?.[s.id]));
  return {
    imageCount:present.length,
    hasFront:Boolean(slots?.front),
    hasMultipleViews:present.length>=2,
    readyForSingleImageResearch:Boolean(slots?.front),
    message:!slots?.front
      ? "Start with a front-facing picture."
      : present.length===1
        ? "Single-image research set ready. Add side views to compare results later."
        : "Multi-view reference set prepared; no 3D inference has run."
  };
}
export function buildCapturePlan(slots,{heightCm=null,selectedProvider="mica"}={}){
  const value=heightCm===""||heightCm==null?null:Number(heightCm);
  if(value!==null && (!Number.isFinite(value)||value<100||value>240)){
    throw Error("Optional human height must be between 100 and 240 cm.");
  }
  const views=CAPTURE_SLOTS.filter(s=>slots?.[s.id]).map(s=>{
    const item=slots[s.id];
    if(!Number.isInteger(item.width)||!Number.isInteger(item.height)||item.width<1||item.height<1){
      throw Error("Capture image dimensions are invalid.");
    }
    return {slot:s.id,width:item.width,height:item.height,mimeType:item.type,sizeBytes:item.size};
  });
  return {
    schema:CAPTURE_SCHEMA,
    kind:"capture-metadata-only",
    // Intentionally excludes image bytes, paths, object URLs, identities and filenames.
    images:views,
    optionalHumanHeightCm:value,
    selectedResearchProvider:String(selectedProvider),
    inference:{executed:false,model:null,meshGenerated:false},
    privacy:{imagesIncluded:false,uploaded:false},
    nextAction:"Use a separately reviewed reconstruction adapter to run actual inference."
  };
}
