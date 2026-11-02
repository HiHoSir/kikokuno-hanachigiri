import * as THREE from 'three';

// Self-contained HD-2D painting experiment. World collision coordinates match hozukiArea.
export function createHozukiHD2D(scene,area){
 const root=new THREE.Group();scene.add(root);
 const disposables=[],obstacles=[],doorways=[];
 const palette={grass:'#73975e',dirt:'#b8a078',roof:'#545d56',stone:'#8d9380'};
 const material=(color)=>{const m=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});disposables.push(m);return m};
 function mesh(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.receiveShadow=true;root.add(m);disposables.push(geo);return m;}
 function cube(x,y,z,w,h,d,color){const m=mesh(new THREE.BoxGeometry(w,h,d),material(color),x,y,z);m.castShadow=h>.6;return m;}
 function canvasTexture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;disposables.push(t);return t;}
 function textureMaterial(draw,w=256,h=256){const t=canvasTexture(draw,w,h);const m=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.12,side:THREE.DoubleSide,roughness:1});disposables.push(m);return m;}
 function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}}
 const earth=textureMaterial((c,w,h)=>{const r=random(17);c.fillStyle='#87a96b';c.fillRect(0,0,w,h);for(let i=0;i<1400;i++){c.fillStyle=r()>.5?'#76965e':'#9db87b';c.fillRect(r()*w,r()*h,1+r()*5,1+r()*3)}});
 const pathMat=textureMaterial((c,w,h)=>{const r=random(31);c.fillStyle='#c1a77c';c.fillRect(0,0,w,h);for(let i=0;i<950;i++){c.fillStyle=r()>.5?'#aa9475':'#d1bc95';c.fillRect(r()*w,r()*h,1+r()*7,1+r()*4)}});
 const roofMat=textureMaterial((c,w,h)=>{c.fillStyle='#57675d';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=18)for(let x=-(y%36);x<w;x+=33){c.fillStyle=(x+y)%3?'#63776a':'#4b5a53';c.fillRect(x+2,y+2,31,14);c.strokeStyle='#405348';c.strokeRect(x+1,y+1,31,15)}});
 function plane(x,y,z,w,d,mat){const m=mesh(new THREE.PlaneGeometry(w,d),mat,x,y,z);m.rotation.x=-Math.PI/2;return m;}
 scene.background=new THREE.Color('#c4d0ba');scene.fog=new THREE.Fog('#c4d0ba',33,75);
 const ambient=new THREE.HemisphereLight('#fff0d5','#68816f',2.15);root.add(ambient);
 const sun=new THREE.DirectionalLight('#fff2cc',2.2);sun.position.set(-9,20,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24});root.add(sun,sun.target);
 cube(0,-.32,0,38,.63,38,'#739760');plane(0,.008,0,37.8,37.8,earth);
 for(const [x,z,w,d] of [[3,0,3.8,31],[-10,0,20,3.3],[10,0,14,3.3],[-12,-8,3.5,13]])plane(x,.021,z,w,d,pathMat);
 // Stream is physically on the field plane and bridged in the original corridor.
 cube(0,.04,7.4,38,.09,3.35,'#518b90');
 plane(0,.095,7.4,38,3.24,material('#74b8bd'));
 for(const [x,w] of [[-11.9,14.2],[12.15,13.7]])obstacles.push({x,z:7.4,w:w/2,d:1.62});
 cube(3,.18,7.4,4.55,.3,4.2,'#97734c');
 for(let z=5.5;z<=9.4;z+=.55)cube(3,.37,z,4.5,.07,.07,'#614c3d');
 // Ground hill slope and summit share the same authoritative elevation coordinates.
 const e=area.elevation,p=e.plateau;
 cube((p.xMin+p.xMax)/2,e.height/2-.12,(p.zMin+p.zMax)/2,p.xMax-p.xMin,e.height+.24,p.zMax-p.zMin,'#7a7b63');
 plane((p.xMin+p.xMax)/2,e.height+.02,(p.zMin+p.zMax)/2,p.xMax-p.xMin,p.zMax-p.zMin,earth);
 const vertices=[],uv=[],idx=[],n=26;
 for(let i=0;i<=n;i++){const t=i/n,z=e.zFront+(e.zTop-e.zFront)*t;for(const dx of [-e.halfWidth,e.halfWidth]){vertices.push(e.cx+dx,e.height*t+.035,z);uv.push((dx+e.halfWidth)/(2*e.halfWidth),t*3)}}
 for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,pathMat);
 // Painted sprite cutouts: independent depth-tested planes rooted in world geometry.
 function illustration(kind){
  return textureMaterial((c,w,h)=>{
   const r=random(kind==='tree'?11:kind==='rock'?47:103);
   c.lineJoin='round';c.lineWidth=9;c.strokeStyle='#41594d';
   const polygon=(pts,color,stroke=true)=>{c.beginPath();c.moveTo(...pts[0]);for(const a of pts.slice(1))c.lineTo(...a);c.closePath();c.fillStyle=color;c.fill();if(stroke)c.stroke()};
   if(kind==='tree'){
    polygon([[112,252],[119,95],[139,95],[151,252]],'#866743');
    for(const [x,y,radius,color] of [[123,92,71,'#456e50'],[77,129,57,'#628e5e'],[177,116,56,'#507b53'],[132,56,59,'#729866']]){
     c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fillStyle=color;c.fill();c.stroke();
     for(let j=0;j<26;j++){const dx=(r()-.5)*radius*1.7,dy=(r()-.5)*radius*1.5;c.fillStyle=r()>.55?'#93b47c':'#385f47';c.fillRect(x+dx,y+dy,5+r()*14,3+r()*9)}
    }
   }else if(kind==='rock'){
    polygon([[12,245],[27,105],[91,58],[185,79],[246,181],[248,250]],'#7e877b');
    polygon([[27,105],[91,58],[121,125],[56,234],[13,242]],'#a4aa94',false);
    polygon([[121,125],[185,79],[245,181],[212,236],[59,236]],'#657b73',false);
    for(let j=0;j<36;j++){c.fillStyle=r()>.5?'#aac095':'#566e55';c.fillRect(r()*225+10,r()*70+178,3+r()*9,2+r()*8)}
   }else{
    polygon([[29,251],[29,93],[226,93],[226,251]],'#bdab88');
    for(let x=43;x<230;x+=35){c.fillStyle='#816b51';c.fillRect(x,95,8,155)}
    polygon([[10,100],[122,26],[246,100],[228,117],[123,49],[28,117]],'#526459');
    for(let j=0;j<7;j++){c.strokeStyle='#8ea192';c.lineWidth=3;c.beginPath();c.moveTo(22+j*32,99-j*1.5);c.lineTo(119+j*17,34+j*9);c.stroke()}
    c.fillStyle='#66523e';c.fillRect(105,160,50,91);
    c.fillStyle='#d4bf86';c.fillRect(176,142,30,36);
   }
  },256,256);
 }
 const tree=illustration('tree'),rock=illustration('rock'),home=illustration('home');
 function stand(x,z,w,h,mat,y=0){
  const m=mesh(new THREE.PlaneGeometry(w,h),mat,x,y+h/2,z);
  // These are world-facing planes (not camera-facing billboards) so movement has real parallax.
  m.rotation.y=0;return m;
 }
 for(const [x,z,y,s] of [[-15,-15,0,1.3],[-7,-16,0,1.1],[3,-16,0,1.2],[16,-16,0,1.25],[-17,-5,0,1.2],[17,1,0,1.1],[16,12,0,1.15],[7.6,-15,e.height,1.1],[14.7,-15,e.height,1.2]]){stand(x,z,3.8*s,4.1*s,tree,y);obstacles.push({x,z,w:.3*s,d:.35*s})}
 for(const [x,z,y,s] of [[8.4,-11,1.4,.9],[14,-11,1.4,1.0],[8.1,-16,e.height,.8],[14.6,-16,e.height,.8],[-13,-9,0,1.2],[-12,-7,0,.9]])stand(x,z,2.7*s,2.15*s,rock,y);
 for(const [x,z,w,h] of [[-10,-6,5.8,5.6],[0,-8,6.4,5.7],[10,-3.4,5.5,5.5],[-12,-13.2,4.8,5.4],[-3,-14,3.6,4.8],[4,-14,3.6,4.8]]){stand(x,z, w,h,home);obstacles.push({x,z,w:w*.32,d:.8})}
 // The summit's illustrated gateway and bell.
 stand(11.3,-15.75,5.2,5.5,home,e.height);
 const bell=mesh(new THREE.SphereGeometry(.43,10,8),material('#c6ac67'),11.3,e.height+1.5,-13.7);bell.castShadow=true;
 obstacles.push({x:11.3,z:-15.75,w:1.1,d:.65});
 return {obstacles,doorways,sun,update(){},dispose(){scene.remove(root);for(const r of disposables)r.dispose()}};
}
