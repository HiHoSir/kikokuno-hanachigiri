import * as THREE from 'three';
import {worldFromScreen,moveWithCollision} from './movement.js';
import {createWorld} from './world.js';
import {createCharacter} from './character.js';
import {createInput} from './input.js';
import {createCameraController} from './camera.js';

// Composition root: game state and subsystems stay independent from rendering details.
const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100);
const {obstacles}=createWorld(scene);
const character=createCharacter(scene);
const cameraControl=createCameraController(camera);
const player={x:0,z:3.6};
const msg=document.querySelector('#msg');
let messageUntil=0;
function action(){
  msg.textContent=Math.hypot(player.x-5,player.z-1)<2.5
    ?'石碑：「ここは立体背景の実験場です。」'
    :'仮キャラクター：「茶屋の柱の前後を歩いてみよう！」';
  msg.style.display='block';messageUntil=performance.now()+3000;
}
const input=createInput(action);
function resize(){
  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  renderer.setSize(w,h,false);cameraControl.resize(w,h);
}
window.addEventListener('resize',resize);resize();
cameraControl.update(player,1);
let previous=performance.now();
function frame(now){
  const dt=Math.min(Math.max((now-previous)/1000,0),.05);previous=now;
  const direction=input.getDirection();
  if(direction.x||direction.y){
    const vector=worldFromScreen(direction.x,direction.y);
    const next=moveWithCollision(player,vector.x,vector.z,dt,3.2,obstacles);
    player.x=next.x;player.z=next.z;
  }
  character.setPosition(player.x,player.z);
  cameraControl.update(player,dt);
  if(msg.style.display==='block'&&now>messageUntil)msg.style.display='none';
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
character.setPosition(player.x,player.z);
requestAnimationFrame(frame);
