import * as THREE from 'three';
import {worldFromScreen,moveWithCollision,CAMERA_OFFSET} from '../src/movement.js';
import {demoArea} from '../src/areas/demo.js?v=0.7.0';
import {resolveArea} from '../src/areas/registry.js?v=0.7.0';
import {applyTransition} from '../src/transitions.js?v=0.7.0';
import {createGameState,interact} from '../src/events.js';
import {createWorld} from '../src/world.js';
import {surfaceHeightAt} from '../src/surfaces.js?v=0.7.0';
import {createInput} from '../src/input.js?v=0.8.0';
import {createCameraController} from '../src/camera.js';
import {crossingPortal} from '../src/portals.js?v=0.7.0';
import {encodeSave,decodeSave} from '../src/save.js?v=0.7.0';
import {createLabCharacter} from './character.js?v=0.9.1';
import {directionFromWorld,advanceGait,NAMES} from './motion.js?v=0.9.1';
const SAVE_KEY='kikoku-field-lab-v1';
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100),cameraControl=createCameraController(camera);
let saved;try{saved=decodeSave(localStorage.getItem(SAVE_KEY),resolveArea)}catch{}
let state=saved||createGameState(demoArea),area=resolveArea(state.areaId),world=createWorld(scene,area);
const character=await createLabCharacter(scene),msg=document.querySelector('#msg');
let direction=0,phase=0,mode='idle',modeUntil=0,messageUntil=0;
const groundAt=(x,z)=>surfaceHeightAt(area,x,z);
function persist(){try{localStorage.setItem(SAVE_KEY,encodeSave(state))}catch{}}
function areaLabel(){document.querySelector('#area-name').textContent=area.name;document.querySelector('#area-status').textContent='現在地：'+area.name}
function enterArea(event){const next=applyTransition(state,event,resolveArea);if(!next)return;world.dispose();area=next;world=createWorld(scene,area);cameraControl.target.set(state.player.x,0,state.player.z);areaLabel();persist()}
function action(){const r=interact(area,state);enterArea(r);msg.textContent=r.text;msg.style.display='block';messageUntil=performance.now()+3000;mode='talk';modeUntil=performance.now()+1200;if(r.changed)persist()}
const input=createInput(action);
document.querySelector('#surprise').onclick=()=>{mode='surprise';modeUntil=performance.now()+650};
document.querySelector('#start').onclick=()=>{world.dispose();state=createGameState(demoArea);area=demoArea;world=createWorld(scene,area);cameraControl.target.set(state.player.x,0,state.player.z);phase=0;areaLabel();persist()};
function resize(){renderer.setSize(innerWidth,innerHeight,false);cameraControl.resize(innerWidth,innerHeight)}addEventListener('resize',resize);resize();cameraControl.update(state.player,1);areaLabel();addEventListener('pagehide',persist);
let previous=performance.now(),autosave=previous+3500;
function frame(now){
 const dt=Math.min(Math.max((now-previous)/1000,0),.05);previous=now;
 const inputVector=input.getDirection(),before={...state.player};let distance=0;
 if(inputVector.x||inputVector.y){const v=worldFromScreen(inputVector.x,inputVector.y);const next=moveWithCollision(state.player,v.x,v.z,dt,3.2,world.obstacles,groundAt);distance=Math.hypot(next.x-before.x,next.z-before.z);state.player.x=next.x;state.player.z=next.z;
  if(distance>.00001)direction=directionFromWorld(next.x-before.x,next.z-before.z,CAMERA_OFFSET);
  const portal=crossingPortal(area,before,state.player);if(portal)enterArea({transition:{to:portal.to,spawn:portal.spawn}});
 }
 phase=advanceGait(phase,distance);if(now>modeUntil)mode='idle';cameraControl.update(state.player,dt);
 const detail=character.update({...state.player,y:groundAt(state.player.x,state.player.z),dt,time:now/1000,direction,phase,moving:distance>.00001,camera,mode,source:Number(document.querySelector('#source').value),groundAt,debug:document.querySelector('#debug').checked});
 const metrics={...detail,area:area.id,direction,phase,distance,moving:distance>.00001,x:state.player.x,z:state.player.z,version:'0.9.1-lab'};window.__kikokuLab=metrics;
 document.querySelector('#telemetry').textContent=`${NAMES[direction]} / ${detail.source}\n高さ ${detail.feetY.toFixed(3)} / 速度 ${(dt?distance/dt:0).toFixed(2)}`;
 if(now>messageUntil)msg.style.display='none';if(now>autosave){persist();autosave=now+3500}renderer.render(scene,camera);window.__kikokuRendered=true;requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
