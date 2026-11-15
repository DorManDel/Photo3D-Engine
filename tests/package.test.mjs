import test from "node:test";
import assert from "node:assert/strict";
import { createTexturedFaceSurface, extractOrderedTriangles, normalizeFaceTopology } from "../packages/face-surface/dist/index.js";
test("distributable package imports without DOM, MediaPipe or Three.js",()=>{
  assert.equal(typeof createTexturedFaceSurface,"function");
  assert.deepEqual(extractOrderedTriangles([[0,1],[1,2],[2,0]],3),[[0,1,2]]);
  const g=normalizeFaceTopology({source:"demo",tessellation:[[0,1],[1,2],[2,0]]},3);
  assert.deepEqual(g.triangles,[[0,1,2]]);
});
