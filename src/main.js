import * as THREE from 'three';
import {worldFromScreen,moveWithCollision} from './movement.js';
import {demoArea} from './areas/demo.js?v=0.4.3';
import {createGameState,interact} from './events.js';
import {createWorld} from './world.js';
import {createCharacter} from './character.js?v=0.4.3';
import {createInput} from './input.js';
import {createCameraController} from './camera.js';

// Composition root: scene, controls and game rules are deliberately separated.
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100);
const state=createGameState(demoArea);
const {obstacles}=createWorld(scene,demoArea);
const character=createCharacter(scene);
const cameraControl=createCameraController(camera);
const msg=document.querySelector('#msg');
let messageUntil=0;
function action(){
  const result=interact(demoArea,state);
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
let previous=performance.now();
function frame(now){
  const dt=Math.min(Math.max((now-previous)/1000,0),.05);previous=now;
  const direction=input.getDirection();
  if(direction.x||direction.y){
    const vector=worldFromScreen(direction.x,direction.y);
    const next=moveWithCollision(state.player,vector.x,vector.z,dt,3.2,obstacles);
    state.player.x=next.x;state.player.z=next.z;
  }
  character.setPosition(state.player.x,state.player.z);
  cameraControl.update(state.player,dt);
  if(msg.style.display==='block'&&now>messageUntil)msg.style.display='none';
  renderer.render(scene,camera);
  window.__kikokuRendered=true;
  requestAnimationFrame(frame);
}
character.setPosition(state.player.x,state.player.z);
requestAnimationFrame(frame);
