import { analyzeFace } from "../models/mediapipe.js";
import { createTexturedFaceSurface } from "../geometry/face-triangles.js";
import { auditFaceSurface } from "../geometry/surface-audit.js";

/**
 * Actual browser inference, not full human reconstruction.
 * Shared normalized MediaPipe provider -> official face triangles -> UV surface.
 * The output is an open 2.5D face mask; additional photos are not fused.
 */
export async function reconstructBaseline(image){
  if(!image?.naturalWidth || !image?.naturalHeight)throw Error("A decoded front-facing image is required.");
  const result=await analyzeFace(image);
  const surface=createTexturedFaceSurface(result,{
    width:image.naturalWidth,height:image.naturalHeight,depthStrength:1
  });
  const audit=auditFaceSurface(surface);
  return {
    image,result,surface,audit,
    provider:"mediapipe-face-landmarker",
    geometryKind:"relative-2.5d-face-only",
    viewsUsed:["front"],
    inferredFullHead:false,
    rigged:false
  };
}

/**
 * Downloadable glTF 2.0 binary with actual source-image texture.
 * GLTFExporter is an official Three.js add-on, lazily loaded on explicit export.
 * No skeleton, hair or unseen-side geometry is invented.
 */
export async function exportBaselineGlb(baseline,{maxTextureSize=1024}={}){
  if(!baseline?.surface || !baseline?.image || !baseline?.result)throw Error("Generate a baseline first.");
  const [T,{GLTFExporter}]=await Promise.all([
    import("three"),import("three/addons/exporters/GLTFExporter.js")
  ]);
  const {surface,image}=baseline;
  const geom=new T.BufferGeometry();
  geom.setAttribute("position",new T.BufferAttribute(surface.positions,3));
  geom.setAttribute("uv",new T.BufferAttribute(surface.uvs,2));
  geom.setIndex(new T.BufferAttribute(surface.indices,1));
  geom.computeVertexNormals();
  const scale=Math.min(1,maxTextureSize/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx){geom.dispose();throw Error("Cannot create texture image for GLB export.");}
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  texture.flipY=true;
  const mat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false});
  const mesh=new T.Mesh(geom,mat);
  mesh.name="Photo3D_MediaPipe_PartialFace";
  mesh.userData={
    sourceProvider:"MediaPipe Face Landmarker",
    geometryKind:"relative-2.5d-face-only",
    sourceViews:["front"],
    closedSurface:baseline.audit.closed,
    relativeDepthNotMetric:true,
    rigged:false
  };
  try{
    const bytes=await new GLTFExporter().parseAsync(mesh,{
      binary:true,onlyVisible:true,maxTextureSize,trs:true
    });
    if(!(bytes instanceof ArrayBuffer) || bytes.byteLength<128)throw Error("Exporter produced no valid GLB.");
    // GLB magic is 'glTF'; length follows the version field in bytes 8..11.
    const v=new DataView(bytes);
    if(v.getUint32(0,true)!==0x46546c67 || v.getUint32(4,true)!==2 || v.getUint32(8,true)!==bytes.byteLength){
      throw Error("Exporter produced an invalid GLB header.");
    }
    return bytes;
  }finally{
    texture.dispose();mat.dispose();geom.dispose();
  }
}
