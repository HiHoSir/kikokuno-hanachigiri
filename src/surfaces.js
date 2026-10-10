// Visual-only ground height for contact decals. No changes to movement or hero Y.
export function surfaceHeightAt(area,x,z){
  let top=-Infinity;
  for(const s of area.shadowSurfaces||[]){
    if(Math.abs(x-s.x)<=s.width/2&&Math.abs(z-s.z)<=s.depth/2)top=Math.max(top,s.top);
  }
  return Number.isFinite(top)?top:0;
}
