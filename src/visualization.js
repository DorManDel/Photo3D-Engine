import { projectFace } from "./geometry/face-topology.js";

/** Canvas views use the same normalized model result; no synthetic depth or features. */
function drawLinks(ctx, vertices, edges, scale, cx, cy, opacity) {
  if (!Array.isArray(edges) || !edges.length) return;
  ctx.strokeStyle = "rgba(192,170,255," + opacity + ")";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [a, b] of edges) {
    const p=vertices[a], q=vertices[b];
    if (!p || !q) continue;
    ctx.moveTo(cx+p.x*scale,cy-p.y*scale);
    ctx.lineTo(cx+q.x*scale,cy-q.y*scale);
  }
  ctx.stroke();
}

export function paintPortrait(canvas, image, result, overlay = true, showMesh = false) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!image) return;
  const iw = image.naturalWidth, ih = image.naturalHeight;
  const scale = Math.min(w / iw, h / ih);
  const rw = iw * scale, rh = ih * scale, left = (w - rw) / 2, top = (h - rh) / 2;
  ctx.drawImage(image, left, top, rw, rh);
  if (!result || !overlay) return;
  if (showMesh && result.topology?.tessellation?.length) {
    ctx.strokeStyle="rgba(182,148,255,.44)";
    ctx.lineWidth=.65;
    ctx.beginPath();
    for (const [a,b] of result.topology.tessellation) {
      const p=result.landmarks[a],q=result.landmarks[b];
      if (!p || !q) continue;
      ctx.moveTo(left+p.x*rw,top+p.y*rh);
      ctx.lineTo(left+q.x*rw,top+q.y*rh);
    }
    ctx.stroke();
  }
  ctx.fillStyle = showMesh ? "rgba(250,223,126,.76)" : "#f3d76f";
  const radius = showMesh ? .7 : 1.3;
  for (const p of result.landmarks) {
    ctx.beginPath(); ctx.arc(left+p.x*rw,top+p.y*rh,radius,0,Math.PI*2);ctx.fill();
  }
}

// Preserve the original public single-landmark projection for existing consumers.
export function projectLandmark({ x,y,z },yawDegrees,pitchDegrees) {
  const yaw=yawDegrees*Math.PI/180,pitch=pitchDegrees*Math.PI/180;
  const px=(x-.5)*2,py=(.5-y)*2,pz=-z*2;
  const xx=px*Math.cos(yaw)+pz*Math.sin(yaw);
  const zz=-px*Math.sin(yaw)+pz*Math.cos(yaw);
  return {x:xx,y:py*Math.cos(pitch)-zz*Math.sin(pitch),z:py*Math.sin(pitch)+zz*Math.cos(pitch)};
}

export function paintLandmarks(canvas, result, yaw=0, pitch=0, {mode="wireframe",zoom=1}={}) {
  const ctx=canvas.getContext("2d");
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  if (!result) return;
  const projected=projectFace(result.landmarks,yaw,pitch);
  const size=Math.min(w,h)*.35*Math.min(2.2,Math.max(.6,Number(zoom)||1));
  const cx=w/2,cy=h/2;
  ctx.strokeStyle="rgba(210,194,248,.17)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-size*1.1,cy);ctx.lineTo(cx+size*1.1,cy);
  ctx.moveTo(cx,cy-size*1.1);ctx.lineTo(cx,cy+size*1.1);ctx.stroke();

  if(mode==="wireframe") drawLinks(ctx,projected,result.topology?.tessellation,size,cx,cy,.45);
  if(mode==="contours") drawLinks(ctx,projected,result.topology?.contours,size,cx,cy,.92);
  const paintDots=mode==="points" || mode==="wireframe";
  if (paintDots) {
    for(const p of [...projected].sort((a,b)=>a.z-b.z)) {
      const radius=mode==="points"?1.9:1.1;
      ctx.fillStyle=p.z>0?"#f3da7d":"#cbb6f7";
      ctx.beginPath();ctx.arc(cx+p.x*size,cy-p.y*size,radius,0,Math.PI*2);ctx.fill();
    }
  }
}
