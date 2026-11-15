import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFaceResult } from "../src/contracts.js";
import { extractOrderedTriangles, createTexturedFaceSurface } from "../src/geometry/face-triangles.js";

const triples=[
  {start:0,end:1},{start:1,end:2},{start:2,end:0},
  {start:0,end:2},{start:2,end:3},{start:3,end:0}
];
function sample(){
  return normalizeFaceResult({
    faceLandmarks:[[
      {x:.25,y:.25,z:-.10},
      {x:.75,y:.25,z:-.20},
      {x:.75,y:.75,z:-.25},
      {x:.25,y:.75,z:-.15}
    ]]
  },"test","test-model",{source:"official-test",tessellation:triples,contours:[]});
}

test("ordered source edges yield exactly official triangles, not guessed diagonals",()=>{
  assert.deepEqual(extractOrderedTriangles(triples,4),[[0,1,2],[0,2,3]]);
  assert.deepEqual(extractOrderedTriangles([[0,1],[2,3],[1,2]],4),[]);
  assert.deepEqual(extractOrderedTriangles([...triples,...triples],4),[[0,1,2],[0,2,3]]);
  assert.equal(extractOrderedTriangles(triples,2).length,0);
});
test("v0.4 preserves original landmark UV coordinates exactly",()=>{
  const data=createTexturedFaceSurface(sample(),{width:600,height:900});
  assert.equal(data.schema,"photo3d.textured-face-surface.v1");
  assert.equal(data.vertexCount,4);
  assert.equal(data.triangleCount,2);
  assert.equal(data.indices.length,6);
  assert.ok(Math.abs(data.uvs[0]-.25)<1e-6);
  assert.ok(Math.abs(data.uvs[1]-.75)<1e-6);
  assert.ok(Math.abs(data.uvs[2]-.75)<1e-6);
  assert.ok(Math.abs(data.uvs[3]-.75)<1e-6);
  assert.ok(data.positions.every(Number.isFinite));
  assert.deepEqual([...data.indices].sort((a,b)=>a-b),[0,0,1,2,2,3].sort((a,b)=>a-b));
});
test("portrait width and height preserve pixel-space facial shape",()=>{
  const data=createTexturedFaceSurface(sample(),{width:600,height:900});
  const dx=Math.abs(data.positions[3]-data.positions[0]);
  const dy=Math.abs(data.positions[7]-data.positions[4]);
  assert.ok(Math.abs(dy/dx-1.5)<1e-5,"0.5 normalized y spans 450px, not 300px");
});
test("relative depth can be flattened without mutating UVs",()=>{
  const source=sample();
  const flat=createTexturedFaceSurface(source,{width:600,height:900,depthStrength:0});
  const raised=createTexturedFaceSurface(source,{width:600,height:900,depthStrength:1});
  assert.ok([...flat.positions].every((v,i)=>i%3!==2||v===0));
  assert.ok([...raised.positions].some((v,i)=>i%3===2&&Math.abs(v)>.01));
  assert.deepEqual([...flat.uvs],[...raised.uvs]);
  assert.deepEqual(source.landmarks.map(p=>p.x),[.25,.75,.75,.25],"input remains immutable");
});
test("untrusted/invalid topology and image dimensions produce errors rather than invented mesh",()=>{
  const data=sample();
  assert.throws(()=>createTexturedFaceSurface({...data,topology:null},{width:600,height:900}),/Official connected/);
  assert.throws(()=>createTexturedFaceSurface(data,{width:0,height:900}),/Invalid/);
  assert.throws(()=>createTexturedFaceSurface(data,{width:600,height:900,depthStrength:12}),/Invalid/);
});

import { auditFaceSurface } from "../src/geometry/surface-audit.js";

test("a two-triangle flat quad has one open boundary component",()=>{
  const surface={
    positions:new Float32Array([0,0,0, 1,0,0, 1,1,0, 0,1,0, 9,9,9]),
    indices:new Uint16Array([0,1,2, 0,2,3])
  };
  const audit=auditFaceSurface(surface);
  assert.equal(audit.schema,"photo3d.surface-audit.v1");
  assert.equal(audit.triangleCount,2);
  assert.equal(audit.boundaryEdgeCount,4);
  assert.equal(audit.boundaryComponents,1);
  assert.equal(audit.nonManifoldEdgeCount,0);
  assert.equal(audit.unusedVertices,1);
  assert.equal(audit.closed,false);
});
test("audit recognizes an overused non-manifold edge but never fills it",()=>{
  const audit=auditFaceSurface({
    positions:new Float32Array([0,0,0, 1,0,0, 0,1,0, 1,1,0, 0,-1,0]),
    indices:new Uint16Array([0,1,2, 1,0,3, 0,1,4])
  });
  assert.equal(audit.nonManifoldEdgeCount,1);
  assert.ok(audit.boundaryEdgeCount>0);
});
test("audit rejects broken or nonexistent surface geometry",()=>{
  assert.throws(()=>auditFaceSurface({positions:new Float32Array(9),indices:new Uint16Array([0,1,4])}),/Invalid triangle index/);
  assert.throws(()=>auditFaceSurface({positions:new Float32Array(9),indices:new Uint16Array([0,1])}),/Valid indexed/);
});
test("provider-defined eye and lip region edges remain normalized without fake indexing",()=>{
  const raw={faceLandmarks:[[{x:.1,y:.2,z:0},{x:.3,y:.4,z:-.1},{x:.5,y:.6,z:-.2}]]};
  const g=normalizeFaceResult(raw,"test","model",{
    source:"provider",tessellation:triples,
    regions:{leftEye:[[0,1],[1,0],[1,99]],rightEye:[[1,2]],lips:[[0,2]]}
  }).topology.regions;
  assert.deepEqual(g.leftEye,[[0,1]]);
  assert.deepEqual(g.rightEye,[[1,2]]);
  assert.deepEqual(g.lips,[[0,2]]);
});
