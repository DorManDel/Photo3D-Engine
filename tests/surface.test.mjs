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
