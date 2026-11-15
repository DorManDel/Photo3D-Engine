/**
 * Convert MediaPipe's ORDERED tessellation edge triplets into genuine triangles.
 * Each official triangle is supplied as [a,b], [b,c], [c,a].
 * Never triangulate an arbitrary unordered wireframe: it could create fake faces.
 * Browser-independent, safe to package separately.
 */
export const FACE_SURFACE_SCHEMA = "photo3d.textured-face-surface.v1";

export function extractOrderedTriangles(connections, count) {
  if (!Array.isArray(connections) || !Number.isInteger(count) || count < 3) return [];
  const triples = [];
  const seen = new Set();
  const endpoints = edge => Array.isArray(edge) ? edge : [edge?.start, edge?.end];
  for (let i = 0; i + 2 < connections.length; i += 3) {
    const [[a,b],[c,d],[e,f]] = [connections[i],connections[i+1],connections[i+2]].map(endpoints);
    if (![a,b,c,d,e,f].every(v => Number.isInteger(v) && v >= 0 && v < count)) continue;
    // A directed closed three-edge cycle is a triangle, NOT just three nearby points.
    if (b !== c || d !== e || f !== a || new Set([a,b,d]).size !== 3) continue;
    const key = [a,b,d].sort((x,y)=>x-y).join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    triples.push([a,b,d]);
  }
  return triples;
}

export function normalizeFaceTriangles(triangles, count) {
  if (!Array.isArray(triangles)) return [];
  const result=[],seen=new Set();
  for(const tri of triangles) {
    if (!Array.isArray(tri) || tri.length !== 3 ||
        !tri.every(v=>Number.isInteger(v) && v >= 0 && v < count) ||
        new Set(tri).size !== 3) continue;
    const key=[...tri].sort((a,b)=>a-b).join(":");
    if (!seen.has(key)) { seen.add(key); result.push([...tri]); }
  }
  return result;
}

/**
 * Texturing contract: XYZ in face-centered photograph pixel space; UV uses exact
 * image-normalized landmark coordinates. Z is MediaPipe-relative, not measured.
 * This preserves image aspect, which a naive x/y-normalized mesh does NOT.
 */
export function createTexturedFaceSurface(result, { width, height, depthStrength = 1 } = {}) {
  const points = result?.landmarks, tris = result?.topology?.triangles;
  if (!Array.isArray(points) || points.length < 3 ||
      !Array.isArray(tris) || tris.length === 0) {
    throw new Error("Official connected face triangles are required; no guessed geometry.");
  }
  if (![width,height].every(n=>Number.isFinite(n) && n > 0) ||
      !Number.isFinite(depthStrength) || depthStrength < 0 || depthStrength > 2) {
    throw new Error("Invalid image dimensions or relative-depth strength.");
  }
  const valid = points.every(p=>[p.x,p.y,p.z].every(Number.isFinite));
  if (!valid) throw new Error("Non-finite face coordinates.");
  const box = points.reduce((acc,p)=>{
    acc.minX=Math.min(acc.minX,p.x*width); acc.maxX=Math.max(acc.maxX,p.x*width);
    acc.minY=Math.min(acc.minY,p.y*height); acc.maxY=Math.max(acc.maxY,p.y*height);
    acc.zSum += p.z;return acc;
  },{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,zSum:0});
  const cx=(box.minX+box.maxX)/2, cy=(box.minY+box.maxY)/2;
  const span=Math.max(1,box.maxX-box.minX,box.maxY-box.minY);
  const factor=2/span;
  const meanZ=box.zSum/points.length;
  const positions=new Float32Array(points.length*3);
  const uvs=new Float32Array(points.length*2);
  for(let i=0;i<points.length;i++){
    const p=points[i];
    positions[i*3]=(p.x*width-cx)*factor;
    positions[i*3+1]=(cy-p.y*height)*factor;
    // MediaPipe z is approximately in normalized image-width units.
    positions[i*3+2]=-(p.z-meanZ)*width*factor*depthStrength;
    uvs[i*2]=p.x;
    uvs[i*2+1]=1-p.y; // Three.js Texture of HTMLImageElement, flipY=true.
  }
  const indices=[];
  for(const [a,b,c] of normalizeFaceTriangles(tris,points.length)){
    // Enforce counterclockwise winding in the X-right/Y-up plane.
    const aX=positions[3*a],aY=positions[3*a+1],bX=positions[3*b],bY=positions[3*b+1],cX=positions[3*c],cY=positions[3*c+1];
    const area=(bX-aX)*(cY-aY)-(bY-aY)*(cX-aX);
    if(Math.abs(area)<1e-8) continue;
    if(area>0) indices.push(a,b,c); else indices.push(a,c,b);
  }
  if(indices.length<3)throw new Error("Face topology has no nondegenerate triangles.");
  return {
    schema: FACE_SURFACE_SCHEMA,
    source: result.provenance?.provider || "unknown",
    geometryKind: "mediapipe-relative-2.5d",
    positions, uvs,
    indices: new Uint16Array(indices),
    vertexCount: points.length,
    triangleCount: indices.length/3,
    depthStrength,
    imageSize: {width,height}
  };
}
