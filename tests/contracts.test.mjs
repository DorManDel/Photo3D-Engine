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

import { normalizeConnections, normalizeFaceTopology, projectFace } from "../src/geometry/face-topology.js";
test("official edge topology normalizer deduplicates and bounds indices",()=>{
  const edges=normalizeConnections([{start:0,end:1},{start:1,end:0},{start:1,end:2},{start:2,end:9},{start:1,end:1}],3);
  assert.deepEqual(edges,[[0,1],[1,2]]);
  const topology=normalizeFaceTopology({source:"test",tessellation:[[0,1],[1,2]],contours:[{start:0,end:2}]},3);
  assert.equal(topology.schema,"photo3d.face-topology.v1");
  assert.deepEqual(topology.contours,[[0,2]]);
});
test("model coordinates and topology appear in the SAME contract result",()=>{
  const raw={faceLandmarks:[[{x:.1,y:.2,z:0},{x:.3,y:.4,z:-.1},{x:.5,y:.6,z:-.2}]]};
  const x=normalizeFaceResult(raw,"test","model",{source:"official",tessellation:[{start:0,end:1},{start:1,end:2}],contours:[[0,2]]});
  assert.equal(x.topology.tessellation.length,2);
  assert.equal(x.landmarks.length,3);
});
test("face-centered projection is finite and stable when face is not at image center",()=>{
  const points=[{x:.75,y:.4,z:-.1},{x:.85,y:.4,z:-.05},{x:.8,y:.6,z:-.08}];
  const output=projectFace(points,40,-20);
  assert.equal(output.length,3);
  assert.ok(output.every(p=>Object.values(p).every(Number.isFinite)));
  assert.ok(Math.abs(output.reduce((s,p)=>s+p.x,0)/output.length)<.25);
});
