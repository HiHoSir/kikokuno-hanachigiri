// Convert a pointer position relative to the center of a touch pad into 8-way input.
// Normalize against pad radius so every sector has identical geometry.
export function dpadDirection(dx,dy,radius,deadZone=.18){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(radius)||radius<=0)return {x:0,y:0};
 const nx=dx/radius,ny=dy/radius;
 if(Math.hypot(nx,ny)<deadZone)return {x:0,y:0};
 const angle=Math.atan2(ny,nx);
 const sector=Math.round(angle/(Math.PI/4));
 const options=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
 const [x,y]=options[(sector+8)%8];
 return {x,y};
}
