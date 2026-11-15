import test from "node:test";
import assert from "node:assert/strict";
import { createTexturedFaceSurface, extractOrderedTriangles, normalizeFaceTopology, auditFaceSurface } from "../packages/face-surface/dist/index.js";
test("distributable package imports without DOM, MediaPipe or Three.js",()=>{
  assert.equal(typeof createTexturedFaceSurface,"function");
  assert.deepEqual(extractOrderedTriangles([[0,1],[1,2],[2,0]],3),[[0,1,2]]);
  const g=normalizeFaceTopology({source:"demo",tessellation:[[0,1],[1,2],[2,0]]},3);
  assert.deepEqual(g.triangles,[[0,1,2]]);
});

test("packaged surface diagnostics stay pure ESM and report actual boundaries",()=>{
  const data=auditFaceSurface({positions:new Float32Array([0,0,0,1,0,0,0,1,0]),indices:new Uint16Array([0,1,2])});
  assert.equal(data.boundaryEdgeCount,3);
  assert.equal(data.boundaryComponents,1);
});
