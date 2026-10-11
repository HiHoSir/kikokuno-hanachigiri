// Common elevation for feet and shadow; surfaces are ordered by height, not draw order.
export function surfaceHeightAt(area,x,z){
  let top=-Infinity;
  for(const s of area.walkSurfaces||area.shadowSurfaces||[]){
    if(Math.abs(x-s.x)<=s.width/2&&Math.abs(z-s.z)<=s.depth/2)top=Math.max(top,s.top);
  }
  if(area.elevation){
    const e=area.elevation,p=e.plateau;
    const onRamp=x>=e.xMin&&x<=e.xMax&&z<=e.zBottom&&z>=e.zTop;
    const onPlateau=x>=p.xMin&&x<=p.xMax&&z>=p.zMin&&z<=p.zMax;
    if(onRamp)top=Math.max(top,e.height*(e.zBottom-z)/(e.zBottom-e.zTop));
    if(onPlateau)top=Math.max(top,e.height);
  }
  return Number.isFinite(top)?top:0;
}
