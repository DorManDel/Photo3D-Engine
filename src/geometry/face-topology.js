/** Geometry helpers shared by inspectors and future renderers; no browser dependencies. */
export const TOPOLOGY_SCHEMA = "photo3d.face-topology.v1";

export function normalizeConnections(connections, count) {
  if (!Array.isArray(connections)) return [];
  const unique = new Set();
  const result = [];
  for (const edge of connections) {
    const a = Array.isArray(edge) ? edge[0] : edge?.start;
    const b = Array.isArray(edge) ? edge[1] : edge?.end;
    if (![a, b].every(Number.isInteger) || a < 0 || b < 0 || a >= count || b >= count || a === b) continue;
    const key = Math.min(a, b) + ":" + Math.max(a, b);
    if (unique.has(key)) continue;
    unique.add(key);
    result.push([a, b]);
  }
  return result;
}

export function normalizeFaceTopology(topology, count) {
  if (!topology) return null;
  return {
    schema: TOPOLOGY_SCHEMA,
    source: String(topology.source || "unknown"),
    tessellation: normalizeConnections(topology.tessellation, count),
    contours: normalizeConnections(topology.contours, count)
  };
}

/** Image-normalized XY and MediaPipe's relative Z, normalized to visible face size.
 * Not a calibrated 3D head reconstruction or a metric depth measurement.
 */
export function projectFace(landmarks, yawDegrees = 0, pitchDegrees = 0) {
  if (!Array.isArray(landmarks) || !landmarks.length) return [];
  const bounds = landmarks.reduce((acc, p) => {
    acc.minX = Math.min(acc.minX, p.x); acc.maxX = Math.max(acc.maxX, p.x);
    acc.minY = Math.min(acc.minY, p.y); acc.maxY = Math.max(acc.maxY, p.y);
    acc.zTotal += p.z; return acc;
  }, {minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,zTotal:0});
  const centerX=(bounds.minX+bounds.maxX)/2, centerY=(bounds.minY+bounds.maxY)/2;
  const centerZ=bounds.zTotal/landmarks.length;
  const span=Math.max(.02,bounds.maxX-bounds.minX,bounds.maxY-bounds.minY);
  const yaw=yawDegrees*Math.PI/180, pitch=pitchDegrees*Math.PI/180;
  const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  return landmarks.map((p,i)=>{
    const px=2*(p.x-centerX)/span, py=2*(centerY-p.y)/span, pz=-2*(p.z-centerZ)/span;
    const x=px*cy+pz*sy, z=-px*sy+pz*cy;
    return {index:i,x,y:py*cp-z*sp,z:py*sp+z*cp};
  });
}
