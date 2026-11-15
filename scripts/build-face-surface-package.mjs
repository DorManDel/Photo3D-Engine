#!/usr/bin/env node
/** Offline build: copy validated pure geometry sources into installable package. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dist=join(root,"packages/face-surface/dist");
await mkdir(dist,{recursive:true});
for (const sourceName of ["face-triangles.js","face-topology.js"]) {
  const source=await readFile(join(root,"src/geometry",sourceName),"utf8");
  await writeFile(join(dist,sourceName),source);
}
await writeFile(join(dist,"index.js"),[
  'export { FACE_SURFACE_SCHEMA, extractOrderedTriangles, normalizeFaceTriangles, createTexturedFaceSurface } from "./face-triangles.js";',
  'export { TOPOLOGY_SCHEMA, normalizeConnections, normalizeFaceTopology, projectFace } from "./face-topology.js";',
  ""
].join("\n"));
process.stdout.write("Built side-effect-free face-surface ESM package (no model weights).\n");
