import { createTexturedFaceSurface } from "../geometry/face-triangles.js";

/**
 * Optional renderer adapter. Real image texture sampled at the model's UVs.
 * Three.js is lazy-loaded only on explicit Textured Mesh selection.
 * This viewer never alters model output or pretends to infer hidden surfaces.
 */
const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";
let threePromise;
export async function createTexturedViewer(container) {
  threePromise ||= import(THREE_URL).catch(error=>{threePromise=null;throw error;});
  const T=await threePromise;
  if (!container || !container.isConnected) throw Error("3D container is unavailable.");
  let renderer,observer,geometry=null,texture=null,material=null,wireMaterial=null,mesh=null,lines=null;
  let destroyed=false;
  const scene=new T.Scene();
  const group=new T.Group();scene.add(group);
  const camera=new T.OrthographicCamera(-1.8,1.8,1.4,-1.4,.01,100);
  camera.position.set(0,0,5);camera.lookAt(0,0,0);
  try {
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:"low-power",preserveDrawingBuffer:true});
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
    renderer.domElement.className="textured-canvas";
    renderer.domElement.setAttribute("aria-label","Interactive real-image textured relative face mesh");
    container.replaceChildren(renderer.domElement);
  } catch(error) {
    throw Error("WebGL is unavailable on this device: "+(error.message||error));
  }
  function draw(){
    if(!destroyed)renderer.render(scene,camera);
  }
  function resize(){
    if(destroyed)return;
    const width=Math.max(2,container.clientWidth),height=Math.max(2,container.clientHeight);
    // Keep orthographic size stable, preserve object proportions, no stretching.
    const halfHeight=1.36,halfWidth=halfHeight*width/height;
    camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    draw();
  }
  observer=new ResizeObserver(resize);observer.observe(container);
  function releaseModel(){
    if(mesh){group.remove(mesh);mesh=null;}
    if(lines){group.remove(lines);lines.geometry.dispose();lines=null;}
    geometry?.dispose();texture?.dispose();material?.dispose();wireMaterial?.dispose();
    geometry=texture=material=wireMaterial=null;
  }
  function setModel(image,result,{depthStrength=1}={}){
    if(destroyed)throw Error("Renderer already disposed.");
    const surface=createTexturedFaceSurface(result,{width:image.naturalWidth,height:image.naturalHeight,depthStrength});
    releaseModel();
    geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.BufferAttribute(surface.positions,3));
    geometry.setAttribute("uv",new T.BufferAttribute(surface.uvs,2));
    geometry.setIndex(new T.BufferAttribute(surface.indices,1));
    geometry.computeVertexNormals();
    // A bounded texture lowers GPU memory on phones; exact UV coordinates remain unchanged.
    const source=document.createElement("canvas");
    const factor=Math.min(1,1536/Math.max(image.naturalWidth,image.naturalHeight));
    source.width=Math.max(1,Math.round(image.naturalWidth*factor));
    source.height=Math.max(1,Math.round(image.naturalHeight*factor));
    const ctx=source.getContext("2d",{alpha:false});
    if(!ctx)throw Error("2D texture canvas is unavailable.");
    ctx.drawImage(image,0,0,source.width,source.height);
    texture=new T.CanvasTexture(source);
    texture.colorSpace=T.SRGBColorSpace;
    texture.flipY=true;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false});
    mesh=new T.Mesh(geometry,material);
    group.add(mesh);
    wireMaterial=new T.LineBasicMaterial({color:0xe6d6ff,opacity:.68,transparent:true,depthTest:false});
    lines=new T.LineSegments(new T.WireframeGeometry(geometry),wireMaterial);
    group.add(lines);lines.visible=false;
    // WireframeGeometry is disposed by releaseModel when the image changes.
    resize();
    return {vertices:surface.vertexCount,triangles:surface.triangleCount,textureWidth:source.width,textureHeight:source.height,depthKind:surface.geometryKind};
  }
  function setView({yaw=0,pitch=0,zoom=1,wireframe=false,depthStrength=1}={}){
    if(destroyed)return;
    group.rotation.order="YXZ";
    group.rotation.y=yaw*Math.PI/180;
    group.rotation.x=pitch*Math.PI/180;
    group.scale.z=Math.max(0,Math.min(2,Number(depthStrength)));
    camera.zoom=Math.max(.5,Math.min(2.5,Number(zoom)||1));
    camera.updateProjectionMatrix();
    if(lines)lines.visible=Boolean(wireframe);
    draw();
  }
  function screenshot(){
    if(destroyed||!mesh)throw Error("Analyze a photo and render its textured mesh first.");
    draw();
    return new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(Error("PNG export failed.")),"image/png"));
  }
  function dispose(){
    if(destroyed)return;
    observer.disconnect();
    releaseModel();renderer.dispose();renderer.forceContextLoss?.();
    renderer.domElement.remove();destroyed=true;
  }
  // Cleanup must happen on repeated model loads too, not only final dispose.
  // Note: caller recreates viewer per image; controls reuse viewer within the image.
  resize();
  return {setModel,setView,screenshot,dispose,render:draw};
}
