import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,worldFromScreen,CAMERA_OFFSET,canStand,moveWithCollision} from '../src/movement.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`expected ${a} approximately ${b}`);
test('diagonal normalized',()=>near(Math.hypot(...Object.values(normalize(1,1))),1));
test('screen up/down/left/right align with projected camera',()=>{
  const o=CAMERA_OFFSET,h=Math.hypot(o.x,o.z),len=Math.hypot(h,o.y),sin=o.y/len;
  const projected=v=>({x:(o.z*v.x-o.x*v.z)/h,y:(o.x*v.x+o.z*v.z)*sin/h});
  for(const [sx,sy] of [[0,-1],[0,1],[1,0],[-1,0],[1,1],[-1,-1]]){
    const v=worldFromScreen(sx,sy),p=projected(v);
    const n=Math.hypot(p.x,p.y);near(p.x/n,sx/Math.hypot(sx,sy));near(p.y/n,sy/Math.hypot(sx,sy));
  }
});
test('movement speed equal in every direction',()=>{for(const [x,y] of [[0,1],[1,0],[1,1]]){const v=worldFromScreen(x,y);near(Math.hypot(v.x,v.z),1)}});
test('posts block feet; walkable props do not enter collider list',()=>{const posts=[{x:0,z:0,w:.15,d:.15}];assert.equal(canStand(0,0,posts),false);assert.equal(canStand(1,1,posts),true)});
test('no tunnelling',()=>{const p=moveWithCollision({x:-.6,z:0},1,0,.05,12,[{x:0,z:0,w:.02,d:1}]);assert.ok(p.x<-.29)});
test('slides along obstacle',()=>{const p=moveWithCollision({x:-.5,z:-1},1,1,.05,3,[{x:0,z:0,w:.1,d:2}]);assert.ok(p.z>-1)});

test('small upward step is traversable',()=>{
 const p=moveWithCollision({x:0,z:0},1,0,.05,3,[],x=>x>.06?.12:0);
 assert.ok(p.x>.06);
});
test('high ledge blocks upward movement',()=>{
 const p=moveWithCollision({x:0,z:0},1,0,.05,3,[],x=>x>.06?.6:0);
 assert.ok(p.x<=.06);
});
test('descending from a high surface is allowed',()=>{
 const p=moveWithCollision({x:0,z:0},1,0,.05,3,[],x=>x<=.06?.6:0);
 assert.ok(p.x>.06);
});
