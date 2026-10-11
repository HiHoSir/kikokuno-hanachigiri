export const NAMES=['正面','右斜め前','右','右斜め後ろ','背面','左斜め後ろ','左','左斜め前'];
export function directionFromWorld(dx,dz,cameraOffset){
 const h=Math.hypot(cameraOffset.x,cameraOffset.z),e=Math.abs(cameraOffset.y)/Math.hypot(h,cameraOffset.y);
 const sx=(dx*cameraOffset.z-dz*cameraOffset.x)/h;
 const sy=(dx*cameraOffset.x+dz*cameraOffset.z)/h*e;
 return (Math.round(Math.atan2(sx,sy)*4/Math.PI)+8)%8;
}
export function advanceGait(phase,distance,stride=.84){return phase+Math.max(0,distance)/stride*Math.PI*2}
export function legacyFrame(direction,phase,moving){
 const group=direction===0?0:direction<=2?1:direction<=5?2:3;
 return group*4+(moving?[0,1,0,3][Math.floor(phase/(Math.PI/2))%4]:0);
}
