// Edge-triggered map transitions: players must enter a portal from outside.
export function crossingPortal(area,previous,current){
 for(const portal of area.portals||[]){
  const inside=p=>Math.abs(p.x-portal.x)<=portal.width/2&&Math.abs(p.z-portal.z)<=portal.depth/2;
  if(!inside(previous)&&inside(current))return portal;
 }
 return null;
}
