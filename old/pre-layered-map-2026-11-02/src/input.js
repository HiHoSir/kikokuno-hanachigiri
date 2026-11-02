import {dpadDirection} from './dpad.js';

const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const keyboard={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
export function createInput(onAction){
 const keys=new Set();
 const pad=document.querySelector('#dpad');
 let activePointer=null, padX=0,padY=0;
 function keyDown(e){const key=keyboard[e.key];if(key){keys.add(key);e.preventDefault()}if(e.key==='Enter'||e.key===' '){onAction();e.preventDefault()}}
 function keyUp(e){keys.delete(keyboard[e.key])}
 function clear(){keys.clear();activePointer=null;padX=0;padY=0;pad?.classList.remove('active')}
 window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clear);
 function updatePad(e){
   const rect=pad.getBoundingClientRect();
   const radius=Math.min(rect.width,rect.height)/2;
   const delta=dpadDirection(e.clientX-(rect.left+rect.width/2),e.clientY-(rect.top+rect.height/2),radius);
   padX=delta.x;padY=delta.y;
   pad.dataset.direction=`${padX},${padY}`;
 }
 function begin(e){
   if(activePointer!==null)return;
   activePointer=e.pointerId;e.preventDefault();pad.setPointerCapture(e.pointerId);
   pad.classList.add('active');updatePad(e);
 }
 function move(e){if(e.pointerId!==activePointer)return;e.preventDefault();updatePad(e)}
 function end(e){if(e.pointerId!==activePointer)return;activePointer=null;padX=padY=0;pad.classList.remove('active');pad.dataset.direction='0,0'}
 pad.addEventListener('pointerdown',begin);pad.addEventListener('pointermove',move);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,end);
 const action=document.querySelector('#talk'),activate=e=>{e.preventDefault();onAction()};
 action.addEventListener('pointerdown',activate);
 return {
   getDirection(){
     let x=padX,y=padY;
     for(const key of keys){const v=directions[key];if(v){x+=v[0];y+=v[1]}}
     return {x,y};
   },
   dispose(){
     window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clear);
     pad.removeEventListener('pointerdown',begin);pad.removeEventListener('pointermove',move);
     for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.removeEventListener(event,end);
     action.removeEventListener('pointerdown',activate);
   }
 };
}
