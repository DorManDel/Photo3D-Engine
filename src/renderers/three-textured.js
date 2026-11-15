import { createTexturedFaceSurface } from "../geometry/face-triangles.js";
import { auditFaceSurface } from "../geometry/surface-audit.js";

/** Optional Three.js renderer; entirely downstream of validated MediaPipe face data. */
const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";
let threePromise;
export async function createTexturedViewer(container){
  threePromise ||= import(THREE_URL).catch(error=>{threePromise=null;throw error;});
  const T=await threePromise;
  if(!container?.isConnected)throw Error("3D container is unavailable.");
  let renderer,observer,geometry=null,texture=null,material=null,wireMaterial=null,borderMaterial=null;
  let mesh=null,lines=null,borders=null,report=null,destroyed=false;
  const scene=new T.Scene(),group=new T.Group();scene.add(group);
  const camera=new T.OrthographicCamera(-1.8,1.8,1.4,-1.4,.01,100);
  camera.position.set(0,0,5);camera.lookAt(0,0,0);
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:"low-power",preserveDrawingBuffer:true});
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
    renderer.domElement.className="textured-canvas";
    renderer.domElement.setAttribute("aria-label","Real-image textured facial surface inspector");
    container.replaceChildren(renderer.domElement);
  }catch(error){
    throw Error("WebGL is unavailable on this device: "+(error.message||error));
  }
  function draw(){if(!destroyed)renderer.render(scene,camera);}
  function resize(){
    if(destroyed)return;
    const width=Math.max(2,container.clientWidth),height=Math.max(2,container.clientHeight);
    const halfHeight=1.36,halfWidth=halfHeight*width/height;
    camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);draw();
  }
  observer=new ResizeObserver(resize);observer.observe(container);
  function releaseModel(){
    if(mesh){group.remove(mesh);mesh=null;}
    if(lines){group.remove(lines);lines.geometry.dispose();lines=null;}
    if(borders){group.remove(borders);borders.geometry.dispose();borders=null;}
    geometry?.dispose();texture?.dispose();material?.dispose();wireMaterial?.dispose();borderMaterial?.dispose();
    geometry=texture=material=wireMaterial=borderMaterial=null;report=null;
  }
  function setModel(image,result,{depthStrength=1}={}){
    if(destroyed)throw Error("Renderer already disposed.");
    const surface=createTexturedFaceSurface(result,{width:image.naturalWidth,height:image.naturalHeight,depthStrength});
    const audit=auditFaceSurface(surface);
    releaseModel();
    geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.BufferAttribute(surface.positions,3));
    geometry.setAttribute("uv",new T.BufferAttribute(surface.uvs,2));
    geometry.setIndex(new T.BufferAttribute(surface.indices,1));
    geometry.computeVertexNormals();
    const source=document.createElement("canvas");
    const factor=Math.min(1,1536/Math.max(image.naturalWidth,image.naturalHeight));
    source.width=Math.max(1,Math.round(image.naturalWidth*factor));
    source.height=Math.max(1,Math.round(image.naturalHeight*factor));
    const ctx=source.getContext("2d",{alpha:false});
    if(!ctx)throw Error("2D texture canvas unavailable.");
    ctx.drawImage(image,0,0,source.width,source.height);
    texture=new T.CanvasTexture(source);
    texture.colorSpace=T.SRGBColorSpace;
    texture.flipY=true;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    // Polygon offset keeps depth-tested line overlays visible without X-ray behavior.
    material=new T.MeshBasicMaterial({
      map:texture,side:T.DoubleSide,toneMapped:false,
      polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1
    });
    mesh=new T.Mesh(geometry,material);group.add(mesh);
    wireMaterial=new T.LineBasicMaterial({
      color:0xe2d3ff,opacity:.82,transparent:true,depthTest:true,depthWrite:false
    });
    lines=new T.LineSegments(new T.WireframeGeometry(geometry),wireMaterial);
    lines.visible=false;group.add(lines);
    const borderCoordinates=[];
    for(const [a,b] of audit.boundaryEdges){
      for(const v of [a,b]){
        borderCoordinates.push(surface.positions[3*v],surface.positions[3*v+1],surface.positions[3*v+2]);
      }
    }
    borderMaterial=new T.LineBasicMaterial({
      color:0xffc35e,opacity:1,transparent:true,depthTest:true,depthWrite:false
    });
    const borderGeometry=new T.BufferGeometry();
    borderGeometry.setAttribute("position",new T.Float32BufferAttribute(borderCoordinates,3));
    borders=new T.LineSegments(borderGeometry,borderMaterial);
    borders.visible=false;group.add(borders);
    report={
      vertices:surface.vertexCount,triangles:surface.triangleCount,
      textureWidth:source.width,textureHeight:source.height,depthKind:surface.geometryKind,
      boundaryEdges:audit.boundaryEdgeCount,boundaryComponents:audit.boundaryComponents,
      nonManifoldEdges:audit.nonManifoldEdgeCount,unusedVertices:audit.unusedVertices
    };
    resize();return {...report};
  }
  function setView({yaw=0,pitch=0,zoom=1,wireframe=false,wireStyle="surface",depthStrength=1}={}){
    if(destroyed)return;
    group.rotation.order="YXZ";
    group.rotation.y=yaw*Math.PI/180;group.rotation.x=pitch*Math.PI/180;
    group.scale.z=Math.max(0,Math.min(2,Number(depthStrength)));
    camera.zoom=Math.max(.5,Math.min(2.5,Number(zoom)||1));
    camera.updateProjectionMatrix();
    const validStyle=["surface","xray","borders"].includes(wireStyle)?wireStyle:"surface";
    if(lines)lines.visible=Boolean(wireframe)&&validStyle!=="borders";
    if(borders)borders.visible=Boolean(wireframe)&&validStyle==="borders";
    if(wireMaterial){wireMaterial.depthTest=validStyle!=="xray";wireMaterial.needsUpdate=true;}
    draw();
  }
  function diagnostics(){
    return {ready:Boolean(mesh),wireDepthTest:wireMaterial?.depthTest??null,
      wireVisible:lines?.visible??false,bordersVisible:borders?.visible??false,report};
  }
  function screenshot(){
    if(destroyed||!mesh)throw Error("Render a textured face before exporting.");
    draw();
    return new Promise((resolve,reject)=>renderer.domElement.toBlob(
      blob=>blob?resolve(blob):reject(Error("PNG export failed.")),"image/png"));
  }
  function dispose(){
    if(destroyed)return;
    observer.disconnect();releaseModel();renderer.dispose();renderer.forceContextLoss?.();
    renderer.domElement.remove();destroyed=true;
  }
  resize();
  return {setModel,setView,screenshot,diagnostics,dispose,render:draw};
}
