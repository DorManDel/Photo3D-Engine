/**
 * Inspect MICA's exported Wavefront OBJ without claiming a reconstruction took place.
 * This contract records geometric evidence only; it contains no face image or identity.
 */
export const RESEARCH_MESH_SCHEMA="photo3d.research-mesh.v1";
export const RESEARCH_MESH_BYTES_LIMIT=24*1024*1024;
export function inspectResearchObj(text,{maxVertices=150_000,maxTriangles=350_000}={}){
  if(typeof text!=="string" || !text.trim())throw Error("Empty OBJ input.");
  const vertices=[],bboxMin=[Infinity,Infinity,Infinity],bboxMax=[-Infinity,-Infinity,-Infinity];
  let faceCount=0,triangles=0;
  for(const line of text.split(/\r?\n/)){
    const raw=line.trim();
    if(!raw||raw.startsWith("#"))continue;
    const tokens=raw.split(/\s+/);
    if(tokens[0]==="v"){
      if(tokens.length<4||vertices.length>=maxVertices)throw Error("Invalid or oversized OBJ vertex list.");
      const coords=tokens.slice(1,4).map(Number);
      if(!coords.every(Number.isFinite))throw Error("Non-finite OBJ vertex.");
      for(let a=0;a<3;a++){
        bboxMin[a]=Math.min(bboxMin[a],coords[a]);
        bboxMax[a]=Math.max(bboxMax[a],coords[a]);
      }
      vertices.push(coords);
    }else if(tokens[0]==="f"){
      const items=tokens.slice(1);
      if(items.length!==3)throw Error("Only triangular OBJ faces are supported for MICA import.");
      const ids=items.map(x=>Number(x.split("/")[0]));
      if(!ids.every(Number.isInteger) || ids.some(i=>i<1||i>vertices.length) || new Set(ids).size!==3){
        throw Error("Invalid OBJ triangle index.");
      }
      if(triangles>=maxTriangles)throw Error("Too many triangles in OBJ.");
      const [a,b,c]=ids.map(i=>vertices[i-1]);
      const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
      const cross=[
        ab[1]*ac[2]-ab[2]*ac[1],
        ab[2]*ac[0]-ab[0]*ac[2],
        ab[0]*ac[1]-ab[1]*ac[0]
      ];
      if(Math.hypot(...cross)<=1e-10)throw Error("Zero-area OBJ face.");
      triangles++;faceCount++;
    }
  }
  if(vertices.length<100||triangles<100)throw Error("OBJ is too small for a reconstructed MICA face mesh.");
  return {
    schema:RESEARCH_MESH_SCHEMA,provider:"MICA (user-supplied OBJ; source not verified)",
    vertices:vertices.length,triangles,faceCount,units:"assumed-mm-from-official-MICA-demo",
    extentMm:bboxMin.map((v,i)=>Math.round((bboxMax[i]-v)*1000)/1000),
    texture:"none-in-official-MICA-OBJ",rigged:false,
    generatedByWebsite:false,verifiedSource:false
  };
}
