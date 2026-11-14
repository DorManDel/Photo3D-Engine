/** Canvas views share exactly one normalized landmark dataset. No invented depth. */
export function paintPortrait(canvas, image, result, overlay = true) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!image) return;
  const iw = image.naturalWidth, ih = image.naturalHeight;
  const scale = Math.min(w / iw, h / ih);
  const rw = iw * scale, rh = ih * scale, left = (w - rw) / 2, top = (h - rh) / 2;
  ctx.drawImage(image, left, top, rw, rh);
  if (!result || !overlay) return;
  ctx.fillStyle = "#f3d76f";
  for (const p of result.landmarks) {
    ctx.beginPath();ctx.arc(left + p.x * rw, top + p.y * rh, 1.3, 0, Math.PI * 2);ctx.fill();
  }
}

export function projectLandmark({ x, y, z }, yawDegrees, pitchDegrees) {
  const yaw = yawDegrees * Math.PI / 180, pitch = pitchDegrees * Math.PI / 180;
  const px = (x - 0.5) * 2, py = (0.5 - y) * 2;
  const pz = -z * 2;
  const xx = px * Math.cos(yaw) + pz * Math.sin(yaw);
  const zz = -px * Math.sin(yaw) + pz * Math.cos(yaw);
  const yy = py * Math.cos(pitch) - zz * Math.sin(pitch);
  const dz = py * Math.sin(pitch) + zz * Math.cos(pitch);
  return { x: xx, y: yy, z: dz };
}

export function paintLandmarks(canvas, result, yaw = 0, pitch = 0) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!result) return;
  const points = result.landmarks.map(p => projectLandmark(p, yaw, pitch)).sort((a,b) => a.z - b.z);
  const size = Math.min(w, h) * .40;
  ctx.strokeStyle = "rgba(219,202,255,.20)";
  ctx.beginPath();ctx.moveTo(w/2 - size,w/2 * 0 + h/2);ctx.lineTo(w/2 + size,h/2);ctx.moveTo(w/2,h/2 - size);ctx.lineTo(w/2,h/2 + size);ctx.stroke();
  for (const p of points) {
    const cx = w/2 + p.x*size, cy = h/2-p.y*size;
    const radius = Math.max(.8,Math.min(3,1.3 + p.z));
    ctx.fillStyle = p.z > 0 ? "#f2d879" : "#b39ae9";
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
  }
}
