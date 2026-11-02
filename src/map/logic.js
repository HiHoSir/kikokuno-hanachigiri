// Pure world-space rules; bitmap dimensions never define physical occupancy.
export function project(p,profile){
 const s=profile.pixelsPerMetre,k=Math.sin(profile.elevation*Math.PI/180);
 return {x:p.x*s,y:p.z*s*k-(p.height||0)*s};
}
export function unproject(p,profile){return {x:p.x/profile.pixelsPerMetre,z:p.y/(profile.pixelsPerMetre*Math.sin(profile.elevation*Math.PI/180))};}
export function pointInPolygon(x,z,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [ax,az]=poly[i],[bx,bz]=poly[j];
  if(((az>z)!==(bz>z))&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
 }
 return inside;
}
function edgeDistance(x,z,a,b){
 const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;
 const t=den?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/den)):0;
 return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}
const translate=(poly,i)=>poly.map(([x,z])=>[x+i.x,z+i.z]);
export function collidersFor(map){return map.instances.filter(i=>map.assets[i.asset].footprint).map(i=>({id:i.id,polygon:translate(map.assets[i.asset].footprint,i)}));}
export function surfacesFor(map){return [...map.surfaces,...map.instances.filter(i=>map.assets[i.asset].surface).map(i=>({id:i.id,polygon:translate(map.assets[i.asset].surface,i)}))];}
export function canStand(map,x,z,radius=.16){
 if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)||radius<0)return false;
 const [x0,z0,x1,z1]=map.bounds;
 if(x-radius<x0||x+radius>x1||z-radius<z0||z+radius>z1)return false;
 const surfaces=surfacesFor(map);
 const onLand=(px,pz)=>surfaces.some(s=>pointInPolygon(px,pz,s.polygon));
 if(!onLand(x,z))return false;
 // Positive surface unions use a 16-point foot perimeter, not sprite alpha.
 for(let n=0;n<16;n++)if(!onLand(x+Math.cos(n*Math.PI/8)*radius,z+Math.sin(n*Math.PI/8)*radius))return false;
 for(const o of collidersFor(map)){
  if(pointInPolygon(x,z,o.polygon))return false;
  for(let i=0;i<o.polygon.length;i++)if(edgeDistance(x,z,o.polygon[i],o.polygon[(i+1)%o.polygon.length])<=radius)return false;
 }
 return true;
}
export function move(map,p,dx,dz,dt,speed=2,radius=.16){
 const len=Math.hypot(dx,dz);if(!len)return {...p};
 const distance=Math.min(.05,Math.max(0,dt))*speed,steps=Math.max(1,Math.ceil(distance/.04));
 let {x,z}=p;
 for(let n=0;n<steps;n++){
  const nx=x+dx/len*distance/steps,nz=z+dz/len*distance/steps;
  if(canStand(map,nx,z,radius))x=nx;
  if(canStand(map,x,nz,radius))z=nz;
 }
 return {x,z};
}
function clearSegment(map,a,b,radius){
 const distance=Math.hypot(a.x-b.x,a.z-b.z),steps=Math.max(1,Math.ceil(distance/.08));
 for(let n=0;n<=steps;n++){const t=n/steps;if(!canStand(map,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,radius))return false;}
 return true;
}
export function findPath(map,start,target,radius=.16,cell=.25){
 if(!canStand(map,start.x,start.z,radius)||!canStand(map,target.x,target.z,radius))return [];
 if(clearSegment(map,start,target,radius))return [{...target}];
 const [ox,oz,maxX,maxZ]=map.bounds,cols=Math.ceil((maxX-ox)/cell)+1,rows=Math.ceil((maxZ-oz)/cell)+1;
 const point=(id)=>({x:ox+(id%cols)*cell,z:oz+Math.floor(id/cols)*cell});
 const nearest=p=>{
  const gx=Math.round((p.x-ox)/cell),gz=Math.round((p.z-oz)/cell);let best=null,dist=Infinity;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
   const x=gx+dx,z=gz+dz;if(x<0||z<0||x>=cols||z>=rows)continue;
   const id=z*cols+x,q=point(id),d=Math.hypot(q.x-p.x,q.z-p.z);
   if(d<dist&&clearSegment(map,p,q,radius)){best=id;dist=d;}
  }return best;
 };
 const first=nearest(start),last=nearest(target);if(first===null||last===null)return [];
 const open=[first],previous=new Map(),cost=new Map([[first,0]]),closed=new Set();
 const end=point(last),heuristic=id=>{const p=point(id);return Math.hypot(p.x-end.x,p.z-end.z);};
 const walkable=new Map(),valid=id=>{if(!walkable.has(id)){const q=point(id);walkable.set(id,canStand(map,q.x,q.z,radius));}return walkable.get(id);};
 for(let iteration=0;open.length&&iteration<10000;iteration++){
  open.sort((a,b)=>(cost.get(b)+heuristic(b))-(cost.get(a)+heuristic(a)));
  const current=open.pop();if(closed.has(current))continue;
  if(current===last){
   const path=[{...target}];let id=last;while(id!==first){path.push(point(id));id=previous.get(id);}path.push(point(first));return path.reverse();
  }
  closed.add(current);const cx=current%cols,cz=Math.floor(current/cols);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=cx+dx,z=cz+dz;if(x<0||z<0||x>=cols||z>=rows)continue;
   const next=z*cols+x;if(closed.has(next)||!valid(next))continue;
   if(dx&&dz&&(!valid(cz*cols+x)||!valid(z*cols+cx)))continue;
   if(!clearSegment(map,point(current),point(next),radius))continue;
   const candidate=cost.get(current)+Math.hypot(dx,dz)*cell;
   if(candidate<(cost.get(next)??Infinity)){cost.set(next,candidate);previous.set(next,current);open.push(next);}
  }
 }
 return [];
}
export const depthOrder=items=>[...items].sort((a,b)=>a.z-b.z||String(a.id).localeCompare(String(b.id)));
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
function polygon(p){return Array.isArray(p)&&p.length>=3&&p.length<=200&&p.every(v=>Array.isArray(v)&&v.length===2&&v.every(finite));}
function imagePath(p){return typeof p==='string'&&p.length<300&&!p.includes('..')&&!/^(?:\/|[a-z]+:)/i.test(p)&&!p.includes('\\');}
export function validateMap(map){
 if(!map||map.schema!==1||typeof map.id!=='string')throw new Error('マップ形式が違います');
 if(!Number.isInteger(map.revision)||map.revision<1)throw new Error('マップの版番号が不正です');
 if(!map.projection||!finite(map.projection.pixelsPerMetre)||map.projection.pixelsPerMetre<=0||!finite(map.projection.elevation)||map.projection.elevation<=0||map.projection.elevation>=90)throw new Error('投影設定が不正です');
 if(!Array.isArray(map.bounds)||map.bounds.length!==4||!map.bounds.every(finite)||map.bounds[2]<=map.bounds[0]||map.bounds[3]<=map.bounds[1]||map.bounds[2]-map.bounds[0]>100||map.bounds[3]-map.bounds[1]>100)throw new Error('マップ範囲が不正です');
 if(!map.ground||!imagePath(map.ground.image)||!Array.isArray(map.ground.size)||map.ground.size.length!==2||!map.ground.size.every(v=>finite(v)&&v>0))throw new Error('地面画像が不正です');
 if(!Array.isArray(map.surfaces)||!map.surfaces.length||!map.surfaces.every(s=>polygon(s.polygon)))throw new Error('歩行面が不正です');
 if(!map.assets||typeof map.assets!=='object'||Array.isArray(map.assets))throw new Error('素材台帳がありません');
 for(const a of Object.values(map.assets)){
  if(!imagePath(a.image)||!Array.isArray(a.size)||a.size.length!==2||!a.size.every(v=>finite(v)&&v>0)||!Array.isArray(a.anchor)||a.anchor.length!==2||!a.anchor.every(finite)||!finite(a.scale)||a.scale<=0)throw new Error('素材の寸法・原点が不正です');
  if((a.footprint&&!polygon(a.footprint))||(a.surface&&!polygon(a.surface)))throw new Error('素材の判定が不正です');
 }
 if(!Array.isArray(map.instances)||map.instances.length>200)throw new Error('配置数が不正です');
 const ids=new Set();
 for(const i of map.instances){if(!i||typeof i.id!=='string'||ids.has(i.id)||!Object.hasOwn(map.assets,i.asset)||!finite(i.x)||!finite(i.z)||i.x<map.bounds[0]||i.x>map.bounds[2]||i.z<map.bounds[1]||i.z>map.bounds[3])throw new Error('配置ID・素材・座標が不正です');ids.add(i.id);}
 if(!Array.isArray(map.landmarks)||map.landmarks.some(p=>!p||!finite(p.x)||!finite(p.z)||!finite(p.radius)||p.radius<=0||typeof p.message!=='string'))throw new Error('目印・調べる範囲が不正です');
 if(!map.spawn||!canStand(map,map.spawn.x,map.spawn.z,.16))throw new Error('開始位置が歩行範囲外です');
 return map;
}

// A route step cannot pass its waypoint, even at low frame rates or run speed.
export function approachTarget(map,player,target,dt,speed=2,radius=.16){
 const dx=target.x-player.x,dz=target.z-player.z,distance=Math.hypot(dx,dz);
 if(distance<1e-9)return {...player};
 return move(map,player,dx,dz,Math.min(dt,distance/speed),speed,radius);
}

// Consume reached waypoints in this tick, so each waypoint does not restart idle.
export function followRoute(map,player,route,dt,speed=2,radius=.16){
 let index=0;while(index<route.length&&Math.hypot(route[index].x-player.x,route[index].z-player.z)<.07)index++;
 const remaining=route.slice(index),target=remaining[0];
 if(!target)return {player,route:[],moving:false,dx:0,dz:0};
 const next=approachTarget(map,player,target,dt,speed,radius),moving=Math.hypot(next.x-player.x,next.z-player.z)>.00001;
 const distance=Math.hypot(target.x-player.x,target.z-player.z);
 return {player:next,route:moving?remaining:[],moving,dx:(target.x-player.x)/distance,dz:(target.z-player.z)/distance};
}
