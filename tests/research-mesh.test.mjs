import test from "node:test";
import assert from "node:assert/strict";
import {inspectResearchObj,RESEARCH_MESH_SCHEMA,RESEARCH_MESH_BYTES_LIMIT} from "../src/studio/research-mesh-contract.js";

function gridObj(n=11){
  const lines=["# Synthetic UNIT TEST fixture, not an AI reconstruction"];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)lines.push(`v ${x} ${y} ${(x*x+y)/100}`);
  for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){
    const a=y*n+x+1,b=a+1,c=a+n,d=c+1;
    lines.push(`f ${a} ${b} ${c}`,`f ${b} ${d} ${c}`);
  }
  return lines.join("\n");
}
test("MICA OBJ validation reports real parsed geometry and explicit unverified provenance",()=>{
  const result=inspectResearchObj(gridObj());
  assert.equal(result.schema,RESEARCH_MESH_SCHEMA);
  assert.equal(result.vertices,121);
  assert.equal(result.triangles,200);
  assert.deepEqual(result.extentMm,[10,10,1.1]);
  assert.equal(result.generatedByWebsite,false);
  assert.equal(result.verifiedSource,false);
  assert.equal(result.rigged,false);
  assert.match(result.units,/assumed-mm/);
  assert.equal(RESEARCH_MESH_BYTES_LIMIT,24*1024*1024);
});
test("MICA OBJ validation rejects truncated, missing and untrustworthy meshes",()=>{
  assert.throws(()=>inspectResearchObj(""),/Empty OBJ/);
  assert.throws(()=>inspectResearchObj("v NaN 1 2\nf 1 2 3"),/Non-finite/);
  assert.throws(()=>inspectResearchObj(gridObj().replace("f 1 2 12","f 1 2 999")),/Invalid OBJ triangle index/);
  assert.throws(()=>inspectResearchObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3"),/too small/);
  assert.throws(()=>inspectResearchObj(gridObj().replace("f 1 2 12","f 1 1 12")),/Invalid OBJ triangle index/);
  assert.throws(()=>inspectResearchObj(gridObj(),{maxVertices:100}),/oversized/);
  assert.throws(()=>inspectResearchObj(gridObj(),{maxTriangles:99}),/Too many triangles/);
});
