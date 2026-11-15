/** Geometry helpers shared by inspectors and future renderers; no browser dependencies. */
import { extractOrderedTriangles, normalizeFaceTriangles } from "./face-triangles.js";

export const TOPOLOGY_SCHEMA = "photo3d.face-topology.v1";

export function normalizeConnections(connections, count) {
  if (!Array.isArray(connections)) return [];
  const unique = new Set(), result=[];
  for(const edge of connections){
    const a=Array.isArray(edge)?edge[0]:edge?.start;
    const b=Array.isArray(edge)?edge[1]:edge?.end;
    if(![a,b].every(Number.isInteger)||a<0||b<0||a>=count||b>=count||a===b)continue;
    const key=Math.min(a,b)+":"+Math.max(a,b);
    if(!unique.has(key)){unique.add(key);result.push([a,b]);}
  }
  return result;
}
export function normalizeFaceTopology(topology,count) {
  if(!topology)return null;
  // Must extract BEFORE deduplicating edges, since official MediaPipe edges
  // come in directed groups of three and deduplication destroys that order.
  const triangles=Array.isArray(topology.triangles)
    ? normalizeFaceTriangles(topology.triangles,count)
    : extractOrderedTriangles(topology.tessellation,count);
  return {
    schema:TOPOLOGY_SCHEMA,source:String(topology.source||"unknown"),
    tessellation:normalizeConnections(topology.tessellation,count),
    contours:normalizeConnections(topology.contours,count),
    triangles
  };
}
/** Relative landmark XYZ, centered in landmark bounding box. NOT calibrated depth. */
export function projectFace(landmarks,yawDegrees=0,pitchDegrees=0) {
  if(!Array.isArray(landmarks)||!landmarks.length)return [];
  const box=landmarks.reduce((o,p)=>{
    o.minX=Math.min(o.minX,p.x);o.maxX=Math.max(o.maxX,p.x);
    o.minY=Math.min(o.minY,p.y);o.maxY=Math.max(o.maxY,p.y);
    o.zTotal+=p.z;return o;
  },{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,zTotal:0});
  const cx=(box.minX+box.maxX)/2,cy=(box.minY+box.maxY)/2,cz=box.zTotal/landmarks.length;
  const span=Math.max(.02,box.maxX-box.minX,box.maxY-box.minY);
  const yaw=yawDegrees*Math.PI/180,pitch=pitchDegrees*Math.PI/180;
  const sinY=Math.sin(yaw),cosY=Math.cos(yaw),sinP=Math.sin(pitch),cosP=Math.cos(pitch);
  return landmarks.map((p,i)=>{
    const x=2*(p.x-cx)/span,y=2*(cy-p.y)/span,z=-2*(p.z-cz)/span;
    const rx=x*cosY+z*sinY,rz=-x*sinY+z*cosY;
    return {index:i,x:rx,y:y*cosP-rz*sinP,z:y*sinP+rz*cosP};
  });
}
