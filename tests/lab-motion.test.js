import test from 'node:test';import assert from 'node:assert/strict';
import {worldFromScreen,CAMERA_OFFSET} from '../src/movement.js';
import {directionFromWorld,advanceGait} from '../field-lab/motion.js';
test('all eight screen inputs preserve displayed direction after camera transform',()=>{
 [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]].forEach(([x,y],i)=>{const v=worldFromScreen(x,y);assert.equal(directionFromWorld(v.x,v.z,CAMERA_OFFSET),i)});
});
test('gait follows actual displacement and stops against obstacles',()=>{assert.equal(advanceGait(3,0),3);assert.equal(advanceGait(0,.84),Math.PI*2);assert.equal(advanceGait(0,-1),0)});
