import test from 'node:test';
import assert from 'node:assert/strict';
import {project,unproject,canStand,move,findPath,validateMap,collidersFor,depthOrder} from '../src/map/logic.js';

const rect=(x,z,w,d)=>[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
const map={schema:1,revision:1,id:'test',projection:{pixelsPerMetre:100,elevation:40},bounds:[0,0,12,10],
 ground:{image:'ground.png',size:[1200,643]},spawn:{x:2,z:5},
 surfaces:[{id:'left',polygon:rect(0,0,5,10)},{id:'right',polygon:rect(7,0,5,10)}],
 assets:{tree:{image:'tree.png',size:[100,200],anchor:[50,190],scale:1,footprint:rect(-.3,-.3,.6,.6)},
 bridge:{image:'bridge.png',size:[200,50],anchor:[100,25],scale:1,surface:rect(-2,-.6,4,1.2),layer:'ground'}},
 instances:[{id:'tree',asset:'tree',x:3,z:3},{id:'bridge',asset:'bridge',x:6,z:5}],landmarks:[]};
test('world metres round trip through explicit projection',()=>{
 const p=project({x:2,z:3},map.projection),w=unproject(p,map.projection);
 assert.ok(Math.abs(w.x-2)<1e-9&&Math.abs(w.z-3)<1e-9);
});
test('river stays blocked except on bridge, including foot radius',()=>{
 assert.equal(canStand(map,6,3,.16),false);assert.equal(canStand(map,6,5,.16),true);
 assert.equal(canStand(map,6,5.55,.16),false);assert.equal(canStand(map,4.98,5,.16),true);
 assert.equal(canStand({...map,instances:map.instances.filter(i=>i.id!=='bridge')},6,5,.16),false);
});
test('trunk footprint is independent of canopy image size',()=>{
 assert.equal(canStand(map,3,3,.16),false);assert.equal(canStand(map,3,2.2,.16),true);
 const moved=structuredClone(map);moved.instances[0].x=4;
 assert.equal(collidersFor(moved)[0].polygon[0][0],3.7);assert.equal(canStand(moved,3,3,.16),true);
});
test('normalised movement and stall cap cannot tunnel through trunks',()=>{
 const flat=structuredClone(map);flat.instances=[];flat.surfaces=[{id:'all',polygon:rect(0,0,12,10)}];
 const diagonal=move(flat,{x:2,z:5},1,1,.05,2,.16),straight=move(flat,{x:2,z:5},1,0,.05,2,.16);
 assert.ok(Math.abs(Math.hypot(diagonal.x-2,diagonal.z-5)-(straight.x-2))<1e-8);
 const p=move(map,{x:3,z:2},0,1,100,20,.16);assert.ok(p.z<2.55);
});
test('tap route crosses actual bridge, and never routes through water',()=>{
 const path=findPath(map,{x:2,z:2},{x:10,z:2},.16);assert.ok(path.length>1);
 for(const p of path)assert.equal(canStand(map,p.x,p.z,.16),true);
 assert.deepEqual(findPath(map,{x:2,z:5},{x:6,z:2},.16),[]);
 const without=structuredClone(map);without.instances=without.instances.filter(i=>i.id!=='bridge');
 assert.deepEqual(findPath(without,{x:2,z:5},{x:10,z:5},.16),[]);
});
test('map JSON round trip and invalid coordinates/source references are rejected',()=>{
 assert.equal(validateMap(JSON.parse(JSON.stringify(map))).id,'test');
 for(const change of [m=>m.instances[0].x=NaN,m=>m.instances[0].asset='missing',m=>m.projection.elevation=0,
   m=>m.instances.push({...m.instances[0]}),m=>m.assets.tree.image='https://example.com/secret',m=>m.spawn={x:6,z:2},m=>m.revision='1',m=>m.landmarks={}]){
  const m=structuredClone(map);change(m);assert.throws(()=>validateMap(m));
 }
});
test('depth order uses anchor ground depth, with stable tie-breaking',()=>{
 const ordered=depthOrder([{id:'b',z:5},{id:'a',z:5},{id:'hero',z:4}]);
 assert.deepEqual(ordered.map(x=>x.id),['hero','a','b']);
});

test('running reaches a short tap target at 20fps without oscillating',async()=>{
 const {approachTarget}=await import('../src/map/logic.js');
 let p={x:2,z:5};const target={x:1.3,z:5.3};
 for(let i=0;i<100;i++)p=approachTarget(map,p,target,.05,3.4,.16);
 assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.000001);
});
