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
 for(let i=0;i<70;i++)p=moveWithCollision(p,0,-1,.05,3.2,[],(x,z)=>surfaceHeightAt(hozukiArea,x,z));
 assert.ok(p.z<-11.6,'character should climb onto the shrine terrace');
 assert.equal(surfaceHeightAt(hozukiArea,p.x,p.z),.55);
});
test('other locations retain their previous ground height',()=>{
 assert.equal(surfaceHeightAt(hozukiArea,3,13.1),0);
 assert.equal(surfaceHeightAt(hozukiArea,-10,-6),0);
});
