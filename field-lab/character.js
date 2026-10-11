import * as THREE from 'three';
import {legacyFrame} from './motion.js?v=0.9.2';
export async function createLabCharacter(scene){
 const [candidate,legacy]=await Promise.all(['./art/manifest.json','./art/v06-manifest.json'].map(async p=>{const r=await fetch(p+'?v=0.9.2');if(!r.ok)throw Error(p);return r.json()}));
 const loader=new THREE.TextureLoader();
 const sets=await Promise.all([candidate,legacy].map(async (set,j)=>({...set,frames:await Promise.all(set.frames.map(async f=>{
  const tex=await loader.loadAsync((j?'../motion-demo/frames/':'./art/')+f.file+'?v=0.9.2');tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;
  const geo=new THREE.PlaneGeometry(f.width/set.pixelsPerUnit,f.height/set.pixelsPerUnit,24,36);
  geo.translate((f.width/2-f.footX)/set.pixelsPerUnit,(f.footY-f.height/2)/set.pixelsPerUnit,0);
  return {...f,tex,geo,base:geo.attributes.position.array.slice()};
 }))})));
 const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.025,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
 
 const hero=new THREE.Mesh(sets[0].frames[0].geo,material);scene.add(hero);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const g=canvas.getContext('2d'),grad=g.createRadialGradient(64,64,3,64,64,60);grad.addColorStop(0,'rgba(20,28,18,.4)');grad.addColorStop(.6,'rgba(20,28,18,.18)');grad.addColorStop(1,'rgba(20,28,18,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.88,.64,12,12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.geometry.rotateX(-Math.PI/2);const shadowBase=shadow.geometry.attributes.position.array.slice();scene.add(shadow);
 const foot=new THREE.Mesh(new THREE.RingGeometry(.07,.09,24),new THREE.MeshBasicMaterial({color:0xffe780,side:THREE.DoubleSide,depthWrite:false}));foot.rotation.x=-Math.PI/2;scene.add(foot);
 let inertia=0;
 return {update({x,z,y,dt,time,direction,phase,moving,camera,mode='idle',source=0,groundAt,debug=false}){
  const set=sets[source],index=source?legacyFrame(direction,phase,moving):direction;
  const f=set.frames[index];hero.geometry=f.geo;material.map=f.tex;
  const a=f.geo.attributes.position.array,b=f.base;const sway=moving?Math.sin(phase)*.007:0;
  inertia+=(sway-inertia)*Math.min(1,dt*9);
  for(let i=0;i<a.length;i+=3){
   const px=b[i],py=b[i+1],upper=Math.max(0,Math.min(1,(py-.55)/.9));
   // Continuous mesh weights: no cutouts, alpha masks, whole-body stretch or foot bob.
   const edge=Math.min(1,Math.abs(px)/.4),cloth=Math.sin(time*2.4+py*2)*.003+inertia;
   a[i]=px+upper*edge*cloth;
   a[i+1]=py+Math.sin(time*2)*.004*Math.sin(Math.PI*Math.max(0,Math.min(1,py/1.8)));
   if(!source&&moving&&py<.48){
    const w=Math.pow(1-Math.max(0,py)/.48,1.5),side=px<0?-1:1;
    a[i]+=Math.sin(phase)*side*.033*w;
    a[i+1]+=Math.max(0,Math.sin(phase)*side)*.025*w;
   }
   if(!moving&&mode==='talk'){a[i]+=Math.sin(time*5)*.009*upper;a[i+1]+=Math.sin(time*5)*.005*upper;}
   if(!moving&&mode==='surprise')a[i+1]+=Math.sin(time*12)*.005*upper;
   a[i+2]=b[i+2];
  }
  f.geo.attributes.position.needsUpdate=true;f.geo.computeBoundingSphere();hero.position.set(x,y+.008,z);hero.quaternion.copy(camera.quaternion);
  const sa=shadow.geometry.attributes.position.array;
  for(let i=0;i<sa.length;i+=3){sa[i]=shadowBase[i];sa[i+1]=groundAt(x+shadowBase[i],z+shadowBase[i+2])-y+.009;sa[i+2]=shadowBase[i+2]}
  shadow.geometry.attributes.position.needsUpdate=true;shadow.position.set(x,y,z);foot.position.set(x,y+.014,z);foot.visible=debug;
  return {frame:index,source:source?'v0.6 / 4方向':'候補 / 8方向',feetY:y,anchor:[f.footX,f.footY]};
 }};
}
