import test from "node:test";
import assert from "node:assert/strict";
import { CAPTURE_SCHEMA, CAPTURE_SLOTS, validateCaptureFile, evaluateCapture, buildCapturePlan } from "../src/studio/capture.js";
import { PROVIDERS, getProvider, providerIsRunnableHere } from "../src/studio/model-catalog.js";

test("capture slots have distinct identifiers and honest input requirements",()=>{
  assert.equal(CAPTURE_SLOTS.length,4);
  assert.equal(new Set(CAPTURE_SLOTS.map(x=>x.id)).size,4);
  assert.equal(evaluateCapture({}).readyForSingleImageResearch,false);
  assert.equal(evaluateCapture({front:{width:100,height:120}}).hasMultipleViews,false);
  assert.equal(evaluateCapture({front:{},left:{}}).hasMultipleViews,true);
});
test("input validation rejects invalid MIME or oversize data without reading bytes",()=>{
  assert.match(validateCaptureFile({type:"application/pdf",size:10}),/PNG/);
  assert.match(validateCaptureFile({type:"image/jpeg",size:13*1024*1024}),/12 MB/);
  assert.equal(validateCaptureFile({type:"image/webp",size:200000}),null);
});
test("capture plan is schema-versioned, contains only image metadata and no fake inference",()=>{
  const slots={front:{width:600,height:900,type:"image/jpeg",size:12452},left:{width:1000,height:1000,type:"image/png",size:15322}};
  const plan=buildCapturePlan(slots,{heightCm:182,selectedProvider:"deca"});
  assert.equal(plan.schema,CAPTURE_SCHEMA);
  assert.equal(plan.kind,"capture-metadata-only");
  assert.equal(plan.images.length,2);
  assert.equal(plan.optionalHumanHeightCm,182);
  assert.equal(plan.selectedResearchProvider,"deca");
  assert.equal(plan.inference.executed,false);
  assert.equal(plan.privacy.imagesIncluded,false);
  assert.equal(plan.privacy.uploaded,false);
  assert.ok(!JSON.stringify(plan).includes("data:image"));
  assert.ok(!JSON.stringify(plan).includes("filename"));
  assert.deepEqual(slots.front,{width:600,height:900,type:"image/jpeg",size:12452},"input unchanged");
});
test("reject untrusted height / malformed image sizes",()=>{
  assert.throws(()=>buildCapturePlan({},{heightCm:300}),/between 100 and 240/);
  assert.throws(()=>buildCapturePlan({front:{width:NaN,height:100,type:"image/jpeg",size:100}}),/dimensions/);
});
test("candidate list is explicitly separated from production model availability",()=>{
  assert.deepEqual(PROVIDERS.map(p=>p.id),["mediapipe","mica","deca","sam3dbody"]);
  assert.equal(providerIsRunnableHere("mica"),false);
  assert.equal(providerIsRunnableHere("deca"),false);
  assert.equal(providerIsRunnableHere("mediapipe"),true);
  assert.equal(getProvider("made-up"),null);
  for(const provider of PROVIDERS){
    assert.ok(provider.source.startsWith("https://"));
    assert.ok(provider.licensing.length>10);
    if(provider.id!=="mediapipe")assert.equal(provider.status,"research");
  }
});
