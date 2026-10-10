import * as THREE from 'three';
import {worldFromScreen,moveWithCollision} from './movement.js';
// Clean-reboot 2D character x real 3D depth PoC. All assets are placeholders.
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b3ccbd');scene.fog=new THREE.Fog('#b3ccbd',20,44);
const camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100),target=new THREE.Vector3();
scene.add(new THREE.HemisphereLight(0xfff6e2,0x657d68,2));
const sun=new THREE.DirectionalLight(0xffecc0,2.2);sun.position.set(-7,14,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;scene.add(sun);scene.add(sun.target);
const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:1}),solid=[];
function block(x,y,z,w,h,d,c,collide=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);if(collide)solid.push({x,z,w:w/2,d:d/2});return mesh}
block(0,-.24,0,42,.45,42,0x75a16c,false);
block(0,-.01,0,5,.05,4,0xb9a67b,false);
block(0,.26,-2,6,.48,2.3,0x785441);
for(const x of [-2.6,2.6])for(const z of [-2.5,.5])block(x,1.45,z,.3,2.9,.3,0x8e543d);
// Keep the test bay open so foreground posts can be inspected without an opaque ceiling.
block(0,3,-2.7,6.6,.34,.7,0x405460,false);
block(0,.23,-.6,1.6,.4,1.2,0xa47a49);
for(const x of [-.7,.7])block(x,.07,.85,.64,.13,.62,0x698c89,false);
for(const [x,z] of [[-6,-3],[6,-4],[-6,5],[6,5],[9,0]]){block(x,.55,z,.32,1.1,.32,0x78513c);const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.32,1),material(0x427e55));tree.position.set(x,2,z);tree.castShadow=true;scene.add(tree);solid.push({x,z,w:.6,d:.6})}
block(5,.5,1,.8,1,.65,0x9b9d92);
// Generated placeholder only: these dimensions impose no restrictions on imported artwork.
const texCanvas=document.createElement('canvas');texCanvas.width=128;texCanvas.height=192;const g=texCanvas.getContext('2d');
g.fillStyle='#b53141';g.fillRect(44,102,40,59);g.fillStyle='#f7e5d3';g.fillRect(49,101,29,36);
g.fillStyle='#58376c';g.beginPath();g.ellipse(64,69,34,38,0,0,Math.PI*2);g.fill();
g.fillStyle='#f6c8a8';g.beginPath();g.ellipse(64,78,23,26,0,0,Math.PI*2);g.fill();
g.fillStyle='#bc354a';g.beginPath();g.ellipse(36,59,16,10,.35,0,Math.PI*2);g.ellipse(92,59,16,10,-.35,0,Math.PI*2);g.fill();
g.fillStyle='#deba62';g.beginPath();g.moveTo(59,55);g.lineTo(64,26);g.lineTo(69,55);g.fill();
g.fillStyle='#572b37';g.fillRect(53,80,6,4);g.fillRect(73,80,6,4);
g.fillStyle='#faf4e7';g.fillRect(50,124,28,21);g.fillStyle='#6b3a3e';g.fillRect(47,154,13,20);g.fillRect(68,154,13,20);
const tex=new THREE.CanvasTexture(texCanvas);tex.colorSpace=THREE.SRGBColorSpace;
const hero=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:.25,depthTest:true,depthWrite:true}));
hero.center.set(.5,0);hero.scale.set(1.25,1.88,1);scene.add(hero);
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.3,24),new THREE.MeshBasicMaterial({color:0x141d17,transparent:true,opacity:.25,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
const player=new THREE.Vector3(0,0,3.6),keys=new Set(),pointerKeys=new Map();const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0],upleft:[-1,-1],upright:[1,-1],downleft:[-1,1],downright:[1,1]};const keyboard={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
window.addEventListener('keydown',e=>{const k=keyboard[e.key];if(k){keys.add(k);e.preventDefault()}if(e.key==='Enter'||e.key===' '){talk();e.preventDefault()}});window.addEventListener('keyup',e=>keys.delete(keyboard[e.key]));window.addEventListener('blur',()=>{keys.clear();pointerKeys.clear()});
for(const button of document.querySelectorAll('[data-dir]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);pointerKeys.set(e.pointerId,button.dataset.dir)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>pointerKeys.delete(e.pointerId))}
const msg=document.querySelector('#msg');let msgDeadline=0;
function talk(){msg.textContent=Math.hypot(player.x-5,player.z-1)<2.5?'石碑：「ここは立体背景の実験場です。」':'仮キャラクター：「茶屋の柱の前後を歩いてみよう！」';msg.style.display='block';msgDeadline=performance.now()+3000}
document.querySelector('#talk').addEventListener('pointerdown',e=>{e.preventDefault();talk()});

function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);const half=5.6;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();let prev=performance.now();
function tick(now){const dt=Math.min((now-prev)/1000,.05);prev=now;let dx=0,dz=0;for(const name of [...keys,...pointerKeys.values()]){const v=dirs[name];if(v){dx+=v[0];dz+=v[1]}}if(dx||dz){const world=worldFromScreen(dx,dz),next=moveWithCollision(player,world.x,world.z,dt,3.2,solid);player.x=next.x;player.z=next.z}
hero.position.set(player.x,.02,player.z);shadow.position.set(player.x,.012,player.z);
target.lerp(new THREE.Vector3(player.x,0,player.z),Math.min(1,dt*5));camera.position.copy(target).add(new THREE.Vector3(11,14,16));camera.lookAt(target);sun.target.position.copy(target);sun.target.updateMatrixWorld();
if(msg.style.display==='block'&&now>msgDeadline)msg.style.display='none';renderer.render(scene,camera);requestAnimationFrame(tick)}
requestAnimationFrame(tick);
