// Camera-aware screen-to-ground movement. No sprite/tile resolution assumptions.
export const normalize=(x,z)=>{const n=Math.hypot(x,z);return n?{x:x/n,z:z/n}:{x:0,z:0}};
export const CAMERA_OFFSET={x:11,y:14,z:16};
export function worldFromScreen(x,y,offset=CAMERA_OFFSET){
  const horizontal=Math.hypot(offset.x,offset.z);
  const length=Math.hypot(horizontal,offset.y);
  if(!horizontal||!offset.y||!length)return normalize(x,y);
  // Camera screen-right = (+z, -x), ground toward camera = (+x,+z).
  // Orthographic projection foreshortens ground-depth by sin(elevation).
  const invElevation=length/Math.abs(offset.y);
  const rx=offset.z/horizontal,rz=-offset.x/horizontal;
  const dx=offset.x/horizontal,dz=offset.z/horizontal;
  return normalize(rx*x+dx*y*invElevation,rz*x+dz*y*invElevation);
}
export function canStand(x,z,obstacles,radius=.28){
  if(Math.abs(x)>19||Math.abs(z)>19)return false;
  return !obstacles.some(o=>Math.abs(x-o.x)<o.w+radius&&Math.abs(z-o.z)<o.d+radius);
}
export function moveWithCollision(position,dx,dz,dt,speed,obstacles){
  const v=normalize(dx,dz),distance=Math.min(Math.max(dt,0),.05)*speed;
  const steps=Math.max(1,Math.ceil(distance/.06));
  let x=position.x,z=position.z;
  for(let i=0;i<steps;i++){
    const nx=x+v.x*distance/steps,nz=z+v.z*distance/steps;
    if(canStand(nx,z,obstacles))x=nx;
    if(canStand(x,nz,obstacles))z=nz;
  }
  return {x,z};
}
