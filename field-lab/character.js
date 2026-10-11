import {actionPose,SHOULDERS} from './actions.js?v=0.11.1';
import * as THREE from 'three';
import {legacyFrame} from './motion.js?v=0.11.1';
import {LEG_LANDMARKS,LEG_DIVIDERS,footCycle,projectGround,updateBlend,smoothstep,shadowTriangleValid} from './rig.js?v=0.11.1';
import {CAMERA_OFFSET} from '../src/movement.js';
function spriteGeometry(f,ppu,divider){
 const cuts=divider===null?[0,f.width]:[0,divider,f.width],positions=[],uvs=[],indices=[],limbs=[];
 for(let part=0;part<cuts.length-1;part++){
  const left=cuts[part],right=cuts[part+1],cols=Math.max(2,Math.ceil((right-left)/7)),rows=64,start=positions.length/3;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
   const x=left+(right-left)*col/cols,y=f.height*row/rows;
   positions.push((x-f.footX)/ppu,(f.footY-y)/ppu,0);uvs.push(x/f.width,1-y/f.height);limbs.push(part);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const a=start+row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;indices.push(a,c,b,b,c,d);
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.setAttribute('aGroundDepth',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3),1));geo.computeVertexNormals();return {geo,limbs};
}
const FAR_LEG_OUTLINES={
 2:[[210,410],[255,410],[250,442],[245,456],[260,471],[285,483],[285,523],[190,523],[188,486],[198,465],[210,448]],
 6:[[114,378],[159,378],[176,420],[179,439],[187,451],[187,489],[86,489],[86,446],[111,435],[123,421]]
};
function farLegGeometry(f,ppu,outline){
 const points=outline.map(([x,y])=>new THREE.Vector2(x,y)),triangles=THREE.ShapeUtils.triangulateShape(points,[]);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(outline.flatMap(([x,y])=>[(x-f.footX)/ppu,(f.footY-y)/ppu,0]),3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(outline.flatMap(([x,y])=>[x/f.width,1-y/f.height]),2));geo.setIndex(triangles.flat());geo.setAttribute('aGroundDepth',new THREE.Float32BufferAttribute(new Float32Array(outline.length),1));geo.computeVertexNormals();return {geo,base:geo.attributes.position.array.slice()};
}
export async function createLabCharacter(scene){
 const [candidate,legacy]=await Promise.all(['./art/manifest.json','./art/v06-manifest.json'].map(async p=>{const r=await fetch(p+'?v=0.11.1');if(!r.ok)throw Error(p);return r.json()}));
 const loader=new THREE.TextureLoader();
 const sets=await Promise.all([candidate,legacy].map(async (set,j)=>({...set,frames:await Promise.all(set.frames.map(async (f,frame)=>{
  const tex=await loader.loadAsync((j?'../motion-demo/frames/':'./art/')+f.file+'?v=0.11.1');tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;
  const {geo,limbs}=spriteGeometry(f,set.pixelsPerUnit,j?null:LEG_DIVIDERS[frame]);
  const base=geo.attributes.position.array.slice(),weights=[];
  for(let i=0;i<base.length;i+=3){
   const px=base[i]*set.pixelsPerUnit+f.footX,py=f.footY-base[i+1]*set.pixelsPerUnit;
   const legs=j?[]:LEG_LANDMARKS[frame];const leg=limbs[i/3];
   const mark=legs[leg],vertical=mark?smoothstep(mark.hip,mark.knee,py):0;
   const edge=mark?1-smoothstep(36,62,Math.abs(px-mark.x)):0,shoe=mark?smoothstep(mark.knee,mark.knee+12,py):0;
   const w=vertical*(edge*(1-shoe)+shoe);
   weights.push({leg,w});
  }
  const far=!j&&FAR_LEG_OUTLINES[frame]?farLegGeometry(f,set.pixelsPerUnit,FAR_LEG_OUTLINES[frame]):null;
  return {...f,tex,geo,base,weights,far};
 }))})));
 const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.025,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
 // Camera-facing XY preserves image proportions. Only depth is taken from an
 // upright plane through the foot, so pillars occlude it like a standing person.
 const elevationTangent=CAMERA_OFFSET.y/Math.hypot(CAMERA_OFFSET.x,CAMERA_OFFSET.z);
 material.onBeforeCompile=shader=>{shader.uniforms.uUprightDepth={value:elevationTangent};shader.vertexShader='uniform float uUprightDepth;\nattribute float aGroundDepth;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 uprightPosition=mvPosition;
 uprightPosition.z+=transformed.y*uUprightDepth+aGroundDepth;
 gl_Position.z=(projectionMatrix*uprightPosition).z;`)};
 material.customProgramCacheKey=()=> 'field-lab-upright-depth-v1';
 const hero=new THREE.Mesh(sets[0].frames[0].geo,material);hero.renderOrder=2;scene.add(hero);
 const farMaterial=material.clone();farMaterial.onBeforeCompile=material.onBeforeCompile;farMaterial.customProgramCacheKey=material.customProgramCacheKey;farMaterial.polygonOffset=true;farMaterial.polygonOffsetFactor=1;farMaterial.polygonOffsetUnits=1;const farLeg=new THREE.Mesh(new THREE.BufferGeometry(),farMaterial);farLeg.renderOrder=1;farLeg.visible=false;scene.add(farLeg);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const g=canvas.getContext('2d'),grad=g.createRadialGradient(64,64,3,64,64,60);grad.addColorStop(0,'rgba(20,28,18,.4)');grad.addColorStop(.6,'rgba(20,28,18,.18)');grad.addColorStop(1,'rgba(20,28,18,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.76,.56,20,20),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.geometry.rotateX(-Math.PI/2);const shadowBase=shadow.geometry.attributes.position.array.slice(),shadowIndices=shadow.geometry.index.array.slice();scene.add(shadow);
 const foot=new THREE.Mesh(new THREE.RingGeometry(.065,.085,24),new THREE.MeshBasicMaterial({color:0xffe780,side:THREE.DoubleSide,depthWrite:false}));foot.rotation.x=-Math.PI/2;scene.add(foot);
 let blend=0,inertia=0,previousDirection=0;const groundDirection={x:0,y:0,z:0};
 return {update({x,z,y,dt,time,direction,phase,moving,camera,mode='idle',actionElapsed=0,source=0,groundAt,debug=false,velocity={x:0,z:0},frozen=false}){
  const set=sets[source],index=source?legacyFrame(direction,phase,moving):direction,f=set.frames[index];hero.geometry=f.geo;material.map=f.tex;
  if(previousDirection!==direction){blend=Math.min(blend,.35);previousDirection=direction}
  blend=frozen?1:updateBlend(blend,moving?1:0,dt,16);
  if(moving){const speed=Math.hypot(velocity.x,velocity.z);if(speed>0){const p=projectGround(velocity.x/speed,velocity.z/speed,CAMERA_OFFSET);groundDirection.x=p.x;groundDirection.y=p.y;groundDirection.z=p.z}}
  const pose=actionPose(mode,actionElapsed);
  const cycle=[footCycle(phase),footCycle(phase+Math.PI)],bodyDrop=-.012*blend;
  const a=f.geo.attributes.position.array,b=f.base,depth=f.geo.attributes.aGroundDepth.array;
  inertia=updateBlend(inertia,moving?Math.sin(phase)*.013:0,dt,7);
  for(let i=0;i<a.length;i+=3){
   const px=b[i],py=b[i+1],upper=smoothstep(.55,1.25,py),edge=smoothstep(.15,.55,Math.abs(px));
   const cloth=(Math.sin(time*2.4+py*2)*.0025+inertia)*edge*upper;
   const breathing=Math.sin(time*2)*.0035*smoothstep(.55,1.1,py);
   a[i]=px+cloth;a[i+1]=py+breathing+bodyDrop;a[i+2]=b[i+2];depth[i/3]=0;
   if(!source){
    const {leg,w}=f.weights[i/3],step=cycle[leg];
    a[i]+=groundDirection.x*step.along*blend*w;
    depth[i/3]=(groundDirection.z-groundDirection.y*elevationTangent)*step.along*blend*w;
    a[i+1]+=(groundDirection.y*step.along+step.lift)*blend*w-bodyDrop*w;
   }
   if(!source){
    const sx=px*set.pixelsPerUnit+f.footX,sy=f.footY-py*set.pixelsPerUnit;
    const shoulders=SHOULDERS[index];
    for(let arm=0;arm<shoulders.length;arm++){
     const [ax,ay]=shoulders[arm],side=shoulders.length===1?(index===2?-1:1):(arm===0?-1:1);
     const outward=(sx-ax)*side;
     const mask=smoothstep(-5,24,outward)*smoothstep(ay-8,ay+40,sy)*(1-smoothstep(ay+92,ay+113,sy));
     const angle=(side<0?pose.left:pose.right)+Math.sin(phase+(side<0?0:Math.PI))*.13*blend;
     const dx=(sx-ax)/set.pixelsPerUnit,dy=(ay-sy)/set.pixelsPerUnit;
     a[i]+=(dx*Math.cos(angle)-dy*Math.sin(angle)-dx)*mask;
     a[i+1]+=(dx*Math.sin(angle)+dy*Math.cos(angle)-dy)*mask;
    }
   }
   a[i+1]-=pose.bow*smoothstep(.5,1.5,py);

  }
  f.geo.attributes.position.needsUpdate=true;f.geo.attributes.aGroundDepth.needsUpdate=true;f.geo.computeBoundingSphere();hero.position.set(x,y+.014+pose.jump,z);hero.quaternion.copy(camera.quaternion);
  farLeg.visible=!!f.far&&source===0&&blend>.002;
  if(farLeg.visible){
   farLeg.geometry=f.far.geo;farMaterial.map=f.tex;const fa=f.far.geo.attributes.position.array,fb=f.far.base,mark=LEG_LANDMARKS[index][0],step=cycle[1];
   for(let i=0;i<fa.length;i+=3){const sourceY=f.footY-fb[i+1]*set.pixelsPerUnit,w=smoothstep(mark.hip,mark.knee,sourceY);fa[i]=fb[i]+groundDirection.x*step.along*blend*w;fa[i+1]=fb[i+1]+bodyDrop+(groundDirection.y*step.along+step.lift)*blend*w-bodyDrop*w;fa[i+2]=fb[i+2];f.far.geo.attributes.aGroundDepth.array[i/3]=(groundDirection.z-groundDirection.y*elevationTangent)*step.along*blend*w;}
   f.far.geo.attributes.position.needsUpdate=true;f.far.geo.attributes.aGroundDepth.needsUpdate=true;f.far.geo.computeBoundingSphere();farLeg.position.copy(hero.position);farLeg.quaternion.copy(hero.quaternion);
  }
  const sa=shadow.geometry.attributes.position.array;
  for(let i=0;i<sa.length;i+=3){sa[i]=shadowBase[i];sa[i+1]=groundAt(x+shadowBase[i],z+shadowBase[i+2])-y+.009;sa[i+2]=shadowBase[i+2]}
  // Never bridge a discontinuous step with a floating diagonal shadow triangle.
  const indices=[];for(let i=0;i<shadowIndices.length;i+=3){const [a,b,c]=shadowIndices.slice(i,i+3);if(shadowTriangleValid(sa[a*3+1],sa[b*3+1],sa[c*3+1]))indices.push(a,b,c)}
  shadow.geometry.setIndex(indices);shadow.geometry.attributes.position.needsUpdate=true;shadow.geometry.computeBoundingSphere();shadow.position.set(x,y,z);foot.position.set(x,y+.014,z);foot.visible=debug;
  return {action:mode,actionStrength:pose.strength,actionElapsed,jump:pose.jump,frame:index,source:source?'v0.6 / 4方向':'候補 / 8方向',feetY:y,anchor:[f.footX,f.footY],rigBlend:blend,visibleLegs:source?null:LEG_LANDMARKS[index].length,stance:cycle.map(c=>c.stance),footLift:cycle.map(c=>c.lift*blend),shadowTriangles:indices.length/3,depthMode:'upright',reusedFarLeg:!!f.far};
 }};
}
