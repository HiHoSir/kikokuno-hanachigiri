import test from 'node:test';import assert from 'node:assert/strict';
import {footCycle,STRIDE,projectGround,shadowTriangleValid,updateBlend} from '../field-lab/rig.js';
import {SCENARIOS} from '../field-lab/scenarios.js';import {demoArea} from '../src/areas/demo.js';import {canStand,CAMERA_OFFSET,worldFromScreen} from '../src/movement.js';
test('supporting foot has zero lift and compensates root movement',()=>{
 const p=.2*2*Math.PI,travel=.001;const a=footCycle(p),b=footCycle(p+travel/STRIDE*2*Math.PI);
 assert.equal(a.lift,0);assert.ok(a.stance);assert.ok(Math.abs(b.along-a.along+travel)<1e-10);
});
test('each gait boundary is continuous and at least one foot stays down',()=>{
 for(const phase of [0,.6*2*Math.PI,2*Math.PI]){const a=footCycle(phase-1e-7),b=footCycle(phase+1e-7);assert.ok(Math.abs(a.along-b.along)<1e-6);assert.ok(Math.abs(a.lift-b.lift)<1e-6)}
 for(let p=0;p<2*Math.PI;p+=.01){const a=footCycle(p),b=footCycle(p+Math.PI);assert.ok(a.stance||b.stance)}
});
test('ground gait projects onto the screen direction',()=>{for(const [x,y] of [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]){const v=worldFromScreen(x,y),p=projectGround(v.x,v.z,CAMERA_OFFSET);assert.ok(Math.abs(p.x*y+p.y*x)<1e-9)}});
test('shadow triangles never span cushion risers',()=>{assert.ok(shadowTriangleValid(.015,.015,.015));assert.equal(shadowTriangleValid(.015,.135,.135),false)});
test('idle blend converges without snapping',()=>{const b=updateBlend(1,0,1/60);assert.ok(b>0&&b<1);let v=1;for(let i=0;i<60;i++)v=updateBlend(v,0,1/60);assert.ok(v<.00001)});
test('all inspection positions are outside production collision bounds',()=>{const obstacles=demoArea.blocks.filter(b=>b[7]).map(([x,y,z,w,h,d])=>({x,z,w:w/2,d:d/2}));for(const [key,p] of Object.entries(SCENARIOS))assert.ok(canStand(p.x,p.z,obstacles),key)});
test('foot depth follows projected ground instead of the vertical body plane',()=>{
 const v=worldFromScreen(0,1),p=projectGround(v.x,v.z,CAMERA_OFFSET),tan=CAMERA_OFFSET.y/Math.hypot(CAMERA_OFFSET.x,CAMERA_OFFSET.z),correction=p.z-p.y*tan;
 assert.ok(p.y<0&&p.z>0);assert.ok(Math.abs(p.y*tan+correction-p.z)<1e-12);
 const back=projectGround(-v.x,-v.z,CAMERA_OFFSET);assert.equal(back.z,-p.z);
});

test('ground projection preserves zero world height when inverted',()=>{const o=CAMERA_OFFSET,h=Math.hypot(o.x,o.z),l=Math.hypot(h,o.y);for(const [dx,dz] of [[1,0],[0,1],[-1,2]]){const p=projectGround(dx,dz,o);assert.ok(Math.abs(p.y*h/l+p.z*o.y/l)<1e-12)}});
