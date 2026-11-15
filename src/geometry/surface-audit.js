/** Pure topology diagnostics. Reports measured mesh edges, never repairs holes. */
export const SURFACE_AUDIT_SCHEMA = "photo3d.surface-audit.v1";

export function auditFaceSurface(surface) {
  const indices=surface?.indices, positions=surface?.positions;
  if(!indices || !positions || indices.length%3!==0 || positions.length%3!==0){
    throw Error("Valid indexed triangle positions are required for a surface audit.");
  }
  const n=positions.length/3, edges=new Map(), used=new Set();
  for(let i=0;i<indices.length;i+=3){
    const triangle=[indices[i],indices[i+1],indices[i+2]];
    if(!triangle.every(v=>Number.isInteger(v)&&v>=0&&v<n)||new Set(triangle).size!==3){
      throw Error("Invalid triangle index in audited surface.");
    }
    for(const v of triangle) used.add(v);
    for(let j=0;j<3;j++){
      const a=triangle[j],b=triangle[(j+1)%3], key=Math.min(a,b)+":"+Math.max(a,b);
      const e=edges.get(key);
      if(e)e.uses++;
      else edges.set(key,{a:Math.min(a,b),b:Math.max(a,b),uses:1});
    }
  }
  const boundaryEdges=[], nonManifoldEdges=[];
  for(const e of edges.values()){
    if(e.uses===1)boundaryEdges.push([e.a,e.b]);
    if(e.uses>2)nonManifoldEdges.push([e.a,e.b]);
  }
  const neighbors=new Map();
  for(const [a,b] of boundaryEdges){
    if(!neighbors.has(a))neighbors.set(a,[]);
    if(!neighbors.has(b))neighbors.set(b,[]);
    neighbors.get(a).push(b);neighbors.get(b).push(a);
  }
  let boundaryComponents=0;
  const visited=new Set();
  for(const start of neighbors.keys()){
    if(visited.has(start))continue;
    boundaryComponents++;
    const stack=[start]; visited.add(start);
    while(stack.length){
      for(const adjacent of neighbors.get(stack.pop())||[]){
        if(!visited.has(adjacent)){visited.add(adjacent);stack.push(adjacent);}
      }
    }
  }
  return {
    schema:SURFACE_AUDIT_SCHEMA,
    triangleCount:indices.length/3,
    vertexCount:n,
    usedVertices:used.size,
    unusedVertices:n-used.size,
    boundaryEdgeCount:boundaryEdges.length,
    boundaryComponents,
    nonManifoldEdgeCount:nonManifoldEdges.length,
    boundaryEdges,
    // Boundary components are NOT automatically classified as eye/mouth holes.
    closed:boundaryEdges.length===0 && nonManifoldEdges.length===0
  };
}
