import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize, worldFromScreen, canStand, moveWithCollision} from '../src/movement.js';
test('diagonal movement normalization',()=>{const v=normalize(1,1);assert.ok(Math.abs(Math.hypot(v.x,v.z)-1)<1e-10)});
test('screen directions map to world axes',()=>{const up=worldFromScreen(0,-1),right=worldFromScreen(1,0);assert.ok(up.x<0&&up.z<0&&right.x>0&&right.z<0)});
test('screen diagonal gives cardinal world movement',()=>{const v=worldFromScreen(1,1);assert.ok(v.x>.99&&Math.abs(v.z)<1e-10)});
test('solid post blocks but walkable cushion does not',()=>{const posts=[{x:0,z:0,w:.15,d:.15}];assert.equal(canStand(0,0,posts),false);assert.equal(canStand(1,1,posts),true)});
test('no tunnelling at maximum delta',()=>{const posts=[{x:0,z:0,w:.02,d:1}];const p=moveWithCollision({x:-.6,z:0},1,0,.05,12,posts);assert.ok(p.x<-.26)});
test('wall sliding can move parallel to obstacle',()=>{const posts=[{x:0,z:0,w:.1,d:2}];const p=moveWithCollision({x:-.5,z:-1},1,1,.05,3,posts);assert.ok(p.z>-1)});
