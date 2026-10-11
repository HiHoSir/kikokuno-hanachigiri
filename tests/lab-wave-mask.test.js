import test from 'node:test';
import assert from 'node:assert/strict';
import {waveWeight} from '../field-lab/wave-mask.js';
test('hair bow and head are excluded from waving',()=>{
 for(let y=0;y<=480;y+=3)for(let x=0;x<=1023;x+=3)assert.equal(waveWeight(x,y),0);
 for(const [x,y] of [[800,500],[780,550],[760,600],[720,680],[650,400],[600,800]])assert.equal(waveWeight(x,y),0);
});
test('raised palm and forearm retain movement, lower sleeve is anchored',()=>{
 assert.ok(waveWeight(880,555)>.9);
 assert.ok(waveWeight(850,630)>.9);
 assert.equal(waveWeight(900,850),0);
});
