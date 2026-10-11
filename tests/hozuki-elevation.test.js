import test from 'node:test';
import assert from 'node:assert/strict';
import {hozukiArea} from '../src/areas/hozuki.js';
import {surfaceHeightAt} from '../src/surfaces.js';
import {moveWithCollision} from '../src/movement.js';

test('Hozuki shrine has a genuinely elevated terrace',()=>{
 assert.equal(surfaceHeightAt(hozukiArea,11.3,-9),0);
 assert.equal(surfaceHeightAt(hozukiArea,11.3,-14),.55);
 assert.ok(surfaceHeightAt(hozukiArea,11.3,-11)>0);
});
test('Hozuki approach rises continuously, without an impassable vertical jump',()=>{
 const start={x:11.3,z:-10.45};
 let p=start;
 let previousHeight=surfaceHeightAt(hozukiArea,p.x,p.z);
 for(let i=0;i<23;i++){
  p=moveWithCollision(p,0,-1,.05,3.2,[],(x,z)=>surfaceHeightAt(hozukiArea,x,z));
  const height=surfaceHeightAt(hozukiArea,p.x,p.z);
  assert.ok(height>=previousHeight-1e-9,'height should not drop on the upward approach');
  assert.ok(height-previousHeight<=.2+1e-9,'each step must satisfy movement maxStep');
  previousHeight=height;
 }
 assert.ok(p.z<-11.6&&p.z>-17.45,'character should stop on the shrine terrace');
 assert.equal(surfaceHeightAt(hozukiArea,p.x,p.z),.55);
});
test('other locations retain their previous ground height',()=>{
 assert.equal(surfaceHeightAt(hozukiArea,3,13.1),0);
 assert.equal(surfaceHeightAt(hozukiArea,-10,-6),0);
});
