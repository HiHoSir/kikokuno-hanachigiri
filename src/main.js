import * as THREE from 'three';
import {worldFromScreen,moveWithCollision} from './movement.js';
import {hozukiArea} from './areas/hozuki.js?v=0.19.0';
import {resolveArea} from './areas/registry.js?v=0.19.0';
import {applyTransition} from './transitions.js?v=0.7.0';
import {createGameState,interact} from './events.js?v=0.9.0';
import {createWorld} from './world.js?v=0.24.0';
import {surfaceHeightAt} from './surfaces.js?v=0.16.0';
import {createLabCharacter} from '../field-lab/character.js?v=0.14.1';
import {directionFromWorld,advanceGait} from '../field-lab/motion.js?v=0.12.1';
import {CAMERA_OFFSET} from './movement.js';
import {createInput} from './input.js?v=0.8.0';
import {createCameraController} from './camera.js?v=0.19.0';
import {crossingPortal} from './portals.js?v=0.7.0';
import {SAVE_KEY,encodeSave,decodeSave} from './save.js?v=0.9.0';

// Composition root: scene, controls and game rules are deliberately separated.
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100);
let saved=null;
try{saved=decodeSave(localStorage.getItem(SAVE_KEY),resolveArea)}catch{}
const params=new URLSearchParams(location.search);
const explore=params.get('area')==='hozuki';
const paintedDemo=explore&&params.get('visual')==='paint';
const state=paintedDemo?createGameState(hozukiArea):(explore?(saved?.areaId===hozukiArea.id?saved:createGameState(hozukiArea)):(saved||createGameState(hozukiArea)));
// Isolated visual test: always begin on shrine summit; do not affect normal saves.
if(paintedDemo){state.player.x=11.3;state.player.z=-13.4;}
let area=resolveArea(state.areaId);
let world=createWorld(scene,area);
const character=await createLabCharacter(scene,'./field-lab/');
let facing=0,gait=0;let mode='idle',modeStarted=0,modeUntil=0;
const cameraControl=createCameraController(camera);
const msg=document.querySelector('#msg');
const areaName=document.querySelector('#area-name');
function persist(){if(paintedDemo)return;try{localStorage.setItem(SAVE_KEY,encodeSave(state))}catch{}}
function enterArea(event){
  const next=applyTransition(state,event,resolveArea);
  if(!next)return;
  world.dispose();area=next;world=createWorld(scene,area);
  areaName.textContent=area.name;
  refreshStatus();
  cameraControl.target.set(state.player.x,surfaceHeightAt(area,state.player.x,state.player.z)+1.25,state.player.z);
  gait=0;
  persist();
}
let messageUntil=0;
function refreshStatus(){document.querySelector('#area-status').textContent='現在地：'+area.name+' ／ HP '+(state.hp??75)+'/'+(state.maxHp??100)+' ／ 薬草 '+(state.inventory?.['薬草']||0)+' ／ 特産野菜 '+(state.inventory?.['鬼灯の里の野菜']||0);}
function playGesture(name){mode=name;modeStarted=performance.now();modeUntil=modeStarted+({surprise:750,wave:1300,bow:1100,cheer:1100}[name]||800);}
for(const name of ['surprise','wave','bow','cheer'])document.querySelector('#'+name)?.addEventListener('click',()=>playGesture(name));
function action(){
  const result=interact(area,state);
  enterArea(result);
  if(result.changed)persist();
  refreshStatus();
  msg.textContent=result.text;
  msg.style.display='block';messageUntil=performance.now()+3000;
}
const hillButton=document.querySelector('#go-hill');
hillButton?.addEventListener('click',()=>{
 if(area.id!=='hozuki-village')return;
 // Painted demo can jump between summit and trail; normal village goes to trail foot.
 const onSummit=surfaceHeightAt(area,state.player.x,state.player.z)>2.5;
 state.player.x=11.3;state.player.z=paintedDemo&&!onSummit?-13.4:-7.95;
 facing=4;gait=0;mode='idle';modeUntil=0;
 cameraControl.target.set(state.player.x,surfaceHeightAt(area,state.player.x,state.player.z)+1.25,state.player.z);
 persist();
 msg.textContent=paintedDemo&&!onSummit?'イラスト検証：風魔の鈴の高台に移動しました。':'風魔の鈴へ続く登り道です。画面の上方向へ進んでください。';
 msg.style.display='block';messageUntil=performance.now()+4500;
});
const input=createInput(action);
function resize(){
  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  renderer.setSize(w,h,false);cameraControl.resize(w,h);
}
window.addEventListener('resize',resize);resize();
cameraControl.update(state.player,1,surfaceHeightAt(area,state.player.x,state.player.z));
areaName.textContent=area.name;refreshStatus();
window.addEventListener('pagehide',persist);
let nextAutosave=performance.now()+3500;
let previous=performance.now();
function frame(now){
  const dt=Math.min(Math.max((now-previous)/1000,0),.05);previous=now;
  const direction=input.getDirection();
  const before={...state.player};
  if((direction.x||direction.y) && (mode==='idle'||now>modeUntil)){
    const previous={...state.player};
    const vector=worldFromScreen(direction.x,direction.y);
    const next=moveWithCollision(state.player,vector.x,vector.z,dt,3.2,world.obstacles,(x,z)=>surfaceHeightAt(area,x,z));
    state.player.x=next.x;state.player.z=next.z;
    const portal=crossingPortal(area,previous,state.player);
    if(portal){enterArea({transition:{to:portal.to,spawn:portal.spawn}});msg.textContent='現在地：'+area.name;msg.style.display='block';messageUntil=now+1700;}
  }
  const movedX=state.player.x-before.x,movedZ=state.player.z-before.z;
  const distance=Math.hypot(movedX,movedZ);
  if(distance>0.00001)facing=directionFromWorld(movedX,movedZ,CAMERA_OFFSET);
  gait=advanceGait(gait,distance);
  if(now>modeUntil)mode='idle';
  cameraControl.update(state.player,dt,surfaceHeightAt(area,state.player.x,state.player.z));
  const groundAt=(x,z)=>surfaceHeightAt(area,x,z);
  character.update({x:state.player.x,z:state.player.z,y:groundAt(state.player.x,state.player.z),dt,time:now/1000,direction:facing,phase:gait,moving:distance>0.00001,velocity:{x:movedX,z:movedZ},camera,mode,actionElapsed:(now-modeStarted)/1000,source:0,groundAt,debug:false});
  world.update?.(now/1000,state.player);
  if(hillButton)hillButton.textContent=paintedDemo?(surfaceHeightAt(area,state.player.x,state.player.z)>2.5?'坂の入口へ':'高台の絵を確認'):(surfaceHeightAt(area,state.player.x,state.player.z)>2?'高台の入口へ戻る':'高台の入口へ');
  if(msg.style.display==='block'&&now>messageUntil)msg.style.display='none';
  if(now>=nextAutosave){persist();nextAutosave=now+3500;}
  renderer.render(scene,camera);
  window.__kikokuRendered=true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
