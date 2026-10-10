// Engine-independent movement and collision logic, in world X/Z plane.
export const normalize = (x,z) => {const n=Math.hypot(x,z);return n?{x:x/n,z:z/n}:{x:0,z:0}};
export const worldFromScreen = (x,y) => {
  // Camera looks from (+X,+Z); screen-right is (+X,-Z), screen-down is (+X,+Z).
  const s=Math.SQRT1_2;
  return normalize((x+y)*s,(y-x)*s);
};
export function canStand(x,z,obstacles,radius=.25){
  if(Math.abs(x)>19||Math.abs(z)>19)return false;
  return !obstacles.some(o=>Math.abs(x-o.x)<o.w+radius&&Math.abs(z-o.z)<o.d+radius);
}
export function moveWithCollision(position,dx,dz,dt,speed,obstacles){
  const v=normalize(dx,dz), distance=Math.min(Math.max(dt,0),.05)*speed;
  // Microsteps prevent tunneling through thin objects at low framerates.
  const steps=Math.max(1,Math.ceil(distance/.08));
  let x=position.x,z=position.z;
  for(let i=0;i<steps;i++){const nx=x+v.x*distance/steps,nz=z+v.z*distance/steps;
    if(canStand(nx,z,obstacles))x=nx;
    if(canStand(x,nz,obstacles))z=nz;
  }
  return {x,z};
}
