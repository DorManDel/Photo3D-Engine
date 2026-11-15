/** Mobile comparison thumbnail: original pixels cropped to detected face bounds. */
export function drawFaceReference(canvas,image,result){
  const ctx=canvas.getContext("2d");
  if(!ctx||!image||!result?.landmarks?.length)return;
  const w=image.naturalWidth,h=image.naturalHeight,pts=result.landmarks;
  let minX=w,maxX=0,minY=h,maxY=0;
  for(const p of pts){minX=Math.min(minX,p.x*w);maxX=Math.max(maxX,p.x*w);minY=Math.min(minY,p.y*h);maxY=Math.max(maxY,p.y*h);}
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const span=Math.min(Math.min(w,h),Math.max(maxX-minX,maxY-minY)*1.3);
  const sx=Math.max(0,Math.min(w-span,cx-span/2));
  const sy=Math.max(0,Math.min(h-span,cy-span/2));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,sx,sy,span,span,0,0,canvas.width,canvas.height);
}
