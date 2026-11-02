import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCharacter} from '../src/map/renderer.js';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('assets/characters/hizuki-v35/character.json'));
test('registered motions load as 8 directions and retain model origin despite different padding',()=>{
 assert.equal(Object.keys(config.motions||{}).length,8);
 validateCharacter(config);
 for(const [id,m] of Object.entries(config.motions)){
  assert.equal(m.directions.length,8);assert.equal(m.frames,8);
  assert.ok(Math.abs(m.anchor[0]-m.padding[0]-config.anchor[0])<1e-9,id);
  assert.ok(Math.abs(m.anchor[1]-m.padding[1]-config.anchor[1])<1e-9,id);
 }
});

test('loops advance from frame zero; one-shot completes and fall holds the last pose',async()=>{
 const {MotionPlayer}=await import('../src/map/motion.js');
 const p=new MotionPlayer(config);
 p.update(100,{moving:true,running:false,facing:'right'});
 assert.equal(p.current.id,'walking');assert.equal(p.current.frame,0);
 p.update(250,{moving:true,running:false,facing:'left',distance:.56/4});
 assert.equal(p.current.frame,2);assert.equal(p.current.facing,'left');
 p.update(0,{moving:true,running:true,facing:'left'});assert.equal(p.current.id,'running');assert.equal(p.current.frame,2);
 p.play('attack_katana','back');assert.equal(p.current.frame,0);
 p.update(1100,{});assert.equal(p.busy,false);assert.equal(p.current.id,'standing');assert.equal(p.current.facing,'back');
 p.play('fall','front');p.update(1800,{});assert.equal(p.current.frame,7);assert.equal(p.busy,true);
 p.cancel();assert.equal(p.busy,false);assert.equal(p.current.id,'standing');
 assert.throws(()=>p.play('unknown','front'));
 assert.throws(()=>p.play('walking','unknown'));
});
test('motion frame uses correct sheet row and its own padded cell',async()=>{
 const {MotionPlayer}=await import('../src/map/motion.js');const p=new MotionPlayer(config);
 p.play('attack_katana','back_left');p.update(260,{});
 assert.deepEqual(p.current.rect,[274,730,137,146]);
 assert.deepEqual(p.current.anchor,config.motions.attack_katana.anchor);
 for(const change of [c=>c.motions.walking.frames=0,c=>c.motions.walking.durationMs=0,c=>c.motions.walking.anchor=[999,999],c=>c.motions.walking.directions=['front','front']]){
  const c=structuredClone(config);change(c);assert.throws(()=>validateCharacter(c));
 }
});

test('tap routing keeps run cycle advancing across intermediate waypoints',async()=>{
 const {followRoute}=await import('../src/map/logic.js');const {MotionPlayer}=await import('../src/map/motion.js');
 const {findPath}=await import('../src/map/logic.js');const map=JSON.parse(fs.readFileSync('maps/village/map.json'));
 let player={...map.spawn},route=findPath(map,player,{x:14.7,z:10.65},.16);const m=new MotionPlayer(config),frames=new Set();
 for(let n=0;n<300&&route.length;n++){
  const result=followRoute(map,player,route,.05,config.runSpeed,config.radius),distance=Math.hypot(result.player.x-player.x,result.player.z-player.z);player=result.player;route=result.route;
  m.update(50,{moving:result.moving,running:true,facing:'right',distance});if(result.moving)frames.add(m.current.frame);
 }
 assert.deepEqual([...frames].sort(),[0,1,2,3,4,5,6,7]);assert.equal(route.length,0);
 assert.ok(Math.hypot(player.x-14.7,player.z-10.65)<.08);
});

test('locomotion follows travelled metres rather than elapsed time, including first step',async()=>{
 const {MotionPlayer}=await import('../src/map/motion.js');const p=new MotionPlayer(config),q=new MotionPlayer(config),stride=.56;
 p.update(1,{moving:true,distance:stride*3/8,facing:'right'});
 q.update(10000,{moving:true,distance:stride*3/8,facing:'right'});
 assert.equal(p.current.frame,3);assert.equal(q.current.frame,3);
 p.update(10000,{moving:true,distance:0,facing:'left'});assert.equal(p.current.frame,3);
 p.update(1,{moving:true,running:true,distance:0,facing:'left'});assert.equal(p.current.frame,3);
 p.update(1,{moving:true,running:true,distance:.76/8,facing:'left'});assert.equal(p.current.frame,4);
 p.update(1,{moving:false,distance:0});assert.equal(p.current.id,'standing');
});
test('equal path lengths give equal phase for diagonal and cardinal movement',async()=>{
 const {MotionPlayer}=await import('../src/map/motion.js');const p=new MotionPlayer(config),q=new MotionPlayer(config);
 p.update(50,{moving:true,distance:Math.hypot(.1,.1),facing:'front_right'});
 q.update(5,{moving:true,distance:.1*Math.SQRT2,facing:'front'});
 assert.equal(p.current.frame,q.current.frame);assert.ok(Math.abs(p.current.phase-q.current.phase)<1e-9);
});
test('camera scale stays independent from character display size',async()=>{
 const {MapRenderer}=await import('../src/map/renderer.js');const r=new MapRenderer({getContext:()=>({})});r.resize=()=>{};r.width=393;r.height=852;
 const map=JSON.parse(fs.readFileSync('maps/village/map.json'));
 r.updateCamera(map,map.spawn,config,false);const zoom=r.camera.zoom;
 r.updateCamera(map,map.spawn,{...config,scale:config.scale/2},false);
 assert.equal(r.camera.zoom,zoom);assert.ok(config.scale<.91);
});
