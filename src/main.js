import * as THREE from 'three';
import {worldFromScreen,moveWithCollision} from './movement.js';
import {hozukiArea} from './areas/hozuki.js?v=0.9.0';
import {resolveArea} from './areas/registry.js?v=0.9.0';
import {applyTransition} from './transitions.js?v=0.7.0';
import {createGameState,interact} from './events.js?v=0.9.0';
import {createWorld} from './world.js?v=0.9.0';
import {surfaceHeightAt} from './surfaces.js?v=0.7.0';
import {createCharacter} from './character.js?v=0.8.1';
import {createInput} from './input.js?v=0.8.0';
import {createCameraController} from './camera.js';
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
const state=explore?createGameState(hozukiArea):(saved||createGameState(hozukiArea));
let area=resolveArea(state.areaId);
let world=createWorld(scene,area);
const character=createCharacter(scene);
const cameraControl=createCameraController(camera);
const msg=document.querySelector('#msg');
const areaName=document.querySelector('#area-name');
function persist(){try{localStorage.setItem(SAVE_KEY,encodeSave(state))}catch{}}
function enterArea(event){
  const next=applyTransition(state,event,resolveArea);
  if(!next)return;
  world.dispose();area=next;world=createWorld(scene,area);
  areaName.textContent=area.name;
  refreshStatus();
  cameraControl.target.set(state.player.x,0,state.player.z);
  character.setPosition(state.player.x,state.player.z,surfaceHeightAt(area,state.player.x,state.player.z));
  persist();
}
let messageUntil=0;
function refreshStatus(){document.querySelector('#area-status').textContent='現在地：'+area.name+' ／ HP '+(state.hp??75)+'/'+(state.maxHp??100)+' ／ 薬草 '+(state.inventory?.['薬草']||0)+' ／ 特産野菜 '+(state.inventory?.['鬼灯の里の野菜']||0);}
function action(){
  const result=interact(area,state);
  enterArea(result);
  if(result.changed)persist();
  refreshStatus();
  msg.textContent=result.text;
  msg.style.display='block';messageUntil=performance.now()+3000;
}
const input=createInput(action);
function resize(){
  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  renderer.setSize(w,h,false);cameraControl.resize(w,h);
}
window.addEventListener('resize',resize);resize();
cameraControl.update(state.player,1);
areaName.textContent=area.name;refreshStatus();
window.addEventListener('pagehide',persist);
let nextAutosave=performance.now()+3500;
let previous=performance.now();
function frame(now){
  const dt=Math.min(Math.max((now-previous)/1000,0),.05);previous=now;
  const direction=input.getDirection();
  if(direction.x||direction.y){
    const previous={...state.player};
    const vector=worldFromScreen(direction.x,direction.y);
    const next=moveWithCollision(state.player,vector.x,vector.z,dt,3.2,world.obstacles,(x,z)=>surfaceHeightAt(area,x,z));
    state.player.x=next.x;state.player.z=next.z;
    const portal=crossingPortal(area,previous,state.player);
    if(portal){enterArea({transition:{to:portal.to,spawn:portal.spawn}});msg.textContent='現在地：'+area.name;msg.style.display='block';messageUntil=now+1700;}
  }
  character.setPosition(state.player.x,state.player.z,surfaceHeightAt(area,state.player.x,state.player.z));
  cameraControl.update(state.player,dt);
  world.update?.(now/1000);
  if(msg.style.display==='block'&&now>messageUntil)msg.style.display='none';
  if(now>=nextAutosave){persist();nextAutosave=now+3500;}
  renderer.render(scene,camera);
  window.__kikokuRendered=true;
  requestAnimationFrame(frame);
}
character.setPosition(state.player.x,state.player.z,surfaceHeightAt(area,state.player.x,state.player.z));
requestAnimationFrame(frame);
