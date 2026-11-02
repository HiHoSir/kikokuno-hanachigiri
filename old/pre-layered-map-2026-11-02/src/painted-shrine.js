import * as THREE from 'three';
// Experimental illustrated overlay. The world beneath supplies collision and elevation.
export function createPaintedShrine(scene,area){
 const root=new THREE.Group();scene.add(root);
 const resources=[];
 function painted(kind){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
  const c=canvas.getContext('2d');
  const path=(pts,fill,stroke='#344a36',line=5)=>{
   c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
   c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=line;c.lineJoin='round';c.stroke();
  };
  if(kind==='tree'){
   path([[110,362],[123,208],[145,206],[157,360]],'#765640','#4e422f',8);
   for(const [x,y,r,col] of [[123,181,86,'#4a7652'],[69,211,60,'#527b50'],[184,196,64,'#66915c'],[132,111,71,'#648c55']]){
    c.beginPath();c.ellipse(x,y,r,r*.68,0,0,Math.PI*2);c.fillStyle=col;c.fill();c.lineWidth=7;c.strokeStyle='#385d45';c.stroke();
    c.beginPath();c.ellipse(x-15,y-15,r*.55,r*.22,-.3,0,Math.PI*2);c.fillStyle='rgba(212,224,157,.24)';c.fill();
   }
  }else if(kind==='rock'){
   path([[23,369],[20,286],[78,190],[157,175],[231,262],[245,367]],'#777e70','#4a5f56',9);
   path([[30,283],[79,192],[123,231],[83,326],[26,354]],'#abb19a','#abb19a',1);
   path([[123,231],[160,176],[229,264],[196,352],[85,354]],'#626f66','#626f66',1);
   for(const [x,y] of [[44,298],[79,249],[190,287]])path([[x,y],[x+13,y-18],[x+25,y-16],[x+21,y]],'#64865a','#64865a',1);
  }else{
   path([[33,365],[34,120],[63,104],[65,320],[194,320],[197,106],[225,125],[222,365]],'#78543f','#503d36',7);
   path([[9,131],[15,103],[240,103],[247,133]],'#956343','#604332',7);
   path([[26,163],[35,149],[226,149],[235,164]],'#b0794b','#664935',4);
   c.beginPath();c.arc(128,253,31,0,Math.PI*2);c.fillStyle='#d3b775';c.fill();c.strokeStyle='#775c45';c.lineWidth=6;c.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  resources.push(tex);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:.08});
  resources.push(mat);return mat;
 }
 const sprites={tree:painted('tree'),rock:painted('rock'),gate:painted('gate')};
 function place(type,x,z,height,width,y=0){
  const geo=new THREE.PlaneGeometry(width,height);resources.push(geo);
  const mesh=new THREE.Mesh(geo,sprites[type]);
  mesh.position.set(x,y+height/2,z);
  mesh.renderOrder=2;root.add(mesh);
 }
 const summit=area.elevation.height;
 // Illustration panels sit in the same X/Z/Y coordinate system as the 3D collision scene.
 for(const [x,z,w] of [[7.25,-13.8,3.7],[15.3,-14.9,4.2],[7.2,-17.1,3.1]])
  place('tree',x,z,w*1.2,w,summit*.68);
 for(const [x,z,y,w] of [[8.9,-11,1.4,2.2],[13.7,-10.8,1.8,2],[8.4,-16,summit,2]])
  place('rock',x,z,y+1.5,w,y);
 place('gate',11.3,-12.5,3.35,2.9,summit);
 return {dispose(){scene.remove(root);for(const r of resources)r.dispose();}};
}
