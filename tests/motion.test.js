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
 p.update(250,{moving:true,running:false,facing:'left'});
 assert.equal(p.current.frame,2);assert.equal(p.current.facing,'left');
 p.update(0,{moving:true,running:true,facing:'left'});assert.equal(p.current.id,'running');assert.equal(p.current.frame,0);
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
