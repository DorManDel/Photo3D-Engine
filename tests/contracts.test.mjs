import test from "node:test";
import assert from "node:assert/strict";
import { LANDMARK_SCHEMA, normalizeFaceResult } from "../src/contracts.js";
import { projectLandmark } from "../src/visualization.js";

test("normalization preserves genuine model coordinates and provider", () => {
  const x = normalizeFaceResult({faceLandmarks:[[{x:.3,y:.4,z:-.2},{x:.7,y:.4,z:-.1}]],faceBlendshapes:[{categories:[{categoryName:"eyeBlinkLeft",score:.2}]}]});
  assert.equal(x.schema,LANDMARK_SCHEMA);
  assert.equal(x.landmarks.length,2);
  assert.deepEqual(x.landmarks[0],{index:0,x:.3,y:.4,z:-.2});
  assert.equal(x.blendshapes[0].name,"eyeBlinkLeft");
  assert.equal(x.provenance.inference,"on-device");
});
test("no face must throw instead of fabricating geometry",()=>{
  assert.throws(()=>normalizeFaceResult({faceLandmarks:[]}),/No face/);
});
test("invalid model numbers must fail",()=>{
  assert.throws(()=>normalizeFaceResult({faceLandmarks:[[{x:NaN,y:1,z:0}]]}),/invalid/);
});
test("rotation projection remains finite at angular bounds",()=>{
  for(const yaw of [-70,0,70]) for(const pitch of [-50,0,50]){
    const p=projectLandmark({x:.5,y:.7,z:-.12},yaw,pitch);
    assert.ok(Object.values(p).every(Number.isFinite));
  }
});
