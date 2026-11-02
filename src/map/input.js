export function createInput(canvas,onTap,onAction){
 const stick=document.querySelector('#stick'),thumb=document.querySelector('#thumb'),keys=new Set();
 let pointer=null,dx=0,dy=0,tap=null;
 const codes={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
 const clear=()=>{keys.clear();pointer=null;dx=dy=0;tap=null;thumb.style.transform='';};
 function update(e){const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,scale=Math.min(1,40/Math.max(1,Math.hypot(x,y)));dx=x*scale/40;dy=y*scale/40;if(Math.hypot(dx,dy)<.12)dx=dy=0;thumb.style.transform=`translate(${dx*29}px,${dy*29}px)`;}
 stick.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;stick.setPointerCapture(e.pointerId);update(e);e.preventDefault();});
 stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer){update(e);e.preventDefault();}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===pointer)clear();});
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(codes[e.key]||codes[k]){keys.add(codes[e.key]?e.key:k);e.preventDefault();}if(e.key==='Enter'||e.key===' '){onAction();e.preventDefault();}});
 window.addEventListener('keyup',e=>{keys.delete(e.key);keys.delete(e.key.toLowerCase());});
 canvas.addEventListener('pointerdown',e=>{tap={id:e.pointerId,x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointerup',e=>{if(tap&&tap.id===e.pointerId&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<12)onTap({x:e.clientX,y:e.clientY});tap=null;});
 canvas.addEventListener('pointercancel',()=>{tap=null;});
 document.querySelector('#action').addEventListener('click',onAction);
 return {clear,direction(){let x=dx,y=dy;for(const k of keys){x+=codes[k][0];y+=codes[k][1];}const n=Math.hypot(x,y);return n?{x:x/Math.max(1,n),y:y/Math.max(1,n)}:{x:0,y:0};}};
}
