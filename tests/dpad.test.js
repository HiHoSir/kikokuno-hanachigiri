import test from 'node:test';
import assert from 'node:assert/strict';
import {dpadDirection} from '../src/dpad.js';
test('D-pad cardinal directions align with screen axes',()=>{
 assert.deepEqual(dpadDirection(0,-70,80),{x:0,y:-1});
 assert.deepEqual(dpadDirection(70,0,80),{x:1,y:0});
 assert.deepEqual(dpadDirection(0,70,80),{x:0,y:1});
 assert.deepEqual(dpadDirection(-70,0,80),{x:-1,y:0});
});
test('D-pad diagonals resolve while sliding',()=>{
 assert.deepEqual(dpadDirection(50,-50,80),{x:1,y:-1});
 assert.deepEqual(dpadDirection(-50,50,80),{x:-1,y:1});
});
test('D-pad center has dead zone',()=>assert.deepEqual(dpadDirection(5,5,80),{x:0,y:0}));
test('invalid geometry does not produce unwanted motion',()=>assert.deepEqual(dpadDirection(1,0,0),{x:0,y:0}));
