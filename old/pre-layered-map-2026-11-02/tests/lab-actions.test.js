import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIONS,actionPose} from '../field-lab/actions.js';
test('every action returns smoothly to idle and has a visible pose',()=>{
 for(const [name,{duration}] of Object.entries(ACTIONS)){
  assert.equal(actionPose(name,0).strength,0);
  const middle=actionPose(name,duration*.3);assert.ok(middle.strength>.9);
  assert.ok(Math.abs(middle.left)+Math.abs(middle.right)+middle.bow+middle.jump>.05);
  const end=actionPose(name,duration);assert.deepEqual(end,{strength:0,left:0,right:0,bow:0,jump:0});
  assert.ok(actionPose(name,duration-1e-6).strength<.00001);
 }
});
test('surprise has a distinct early upward reaction',()=>{const p=actionPose('surprise',.2);assert.ok(p.jump>.05&&p.left<-.4&&p.right>.4)});
