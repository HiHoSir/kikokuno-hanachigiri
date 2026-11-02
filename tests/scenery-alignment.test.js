import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collidersFor,depthOrder,project,validateMap} from '../src/map/logic.js';
const source=()=>JSON.parse(fs.readFileSync('maps/village/map.json'));
test('source-pixel contact polygons follow the rendered scale and anchor',()=>{
 const m=source(),i=m.instances.find(i=>i.id==='house-west'),a=m.assets[i.asset];
 a.footprintPx=[[100,700],[1300,700],[1300,950],[100,950]];delete a.footprint;
 const p=collidersFor(m).find(p=>p.id===i.id);assert.ok(p);
 for(let n=0;n<4;n++){const q=project({x:p.polygon[n][0],z:p.polygon[n][1]},m.projection),origin=project(i,m.projection);
 assert.ok(Math.abs(q.x-(origin.x+(a.footprintPx[n][0]-a.anchor[0])*a.scale))<1e-8);
 assert.ok(Math.abs(q.y-(origin.y+(a.footprintPx[n][1]-a.anchor[1])*a.scale))<1e-8);}
 a.scale*=.5;assert.notDeepEqual(collidersFor(m).find(p=>p.id===i.id).polygon,p.polygon);
});
test('a hero in front of the physical door wall renders after the house',()=>{
 const m=source(),house=m.instances.find(i=>i.id==='house-west');m.assets[house.asset].sortY=940;
 const hero={id:'~hero',x:house.x,z:house.z-.05};
 assert.deepEqual(depthOrder([house,hero],m).map(i=>i.id),[house.id,'~hero']);
 const behind={...hero,z:house.z-1};assert.deepEqual(depthOrder([house,behind],m).map(i=>i.id),['~hero',house.id]);
});
test('malformed pixel geometry cannot replace a working map',()=>{
 for(const change of [a=>a.footprintPx=[[1,2],[3,NaN],[4,5]],a=>a.sortY=Infinity]){
 const m=source();change(m.assets.house);assert.throws(()=>validateMap(m));}
});

test('current scenery contact centres block, while both door approaches and bridge remain reachable',async()=>{
 const {canStand,findPath,move,surfacesFor}=await import('../src/map/logic.js');const m=source();
 for(const o of collidersFor(m)){
  const centre=o.polygon.reduce((p,q)=>({x:p.x+q[0]/o.polygon.length,z:p.z+q[1]/o.polygon.length}),{x:0,z:0});
  assert.equal(canStand(m,centre.x,centre.z,.16),false,o.id);
 }
 for(const id of ['house-west','house-east']){const i=m.instances.find(i=>i.id===id),target={x:i.x,z:i.z-.05};
  assert.ok(canStand(m,target.x,target.z,.16),id);assert.ok(findPath(m,m.spawn,target,.16).length,id);
  let p={x:i.x,z:i.z+.7};for(let n=0;n<50;n++)p=move(m,p,0,-1,.05,2.8,.16);
  assert.ok(p.z<i.z+.05&&p.z>i.z-.1,id);assert.ok(canStand(m,p.x,p.z,.16));
 }
 for(const p of [{x:14.7,z:10.65},{x:15,z:14.75}])assert.ok(findPath(m,m.spawn,p,.16).length);
 assert.equal(canStand(m,13,6,.16),false);
});
