import test from 'node:test';
import assert from 'node:assert/strict';
import {anchorOffsetY} from '../src/anchor.js';
test('placeholder whitespace underneath feet is compensated',()=>assert.equal(anchorOffsetY(1.88,174,192),1.88*18/192));
test('normalized anchor works with arbitrary source resolution',()=>assert.equal(anchorOffsetY(2,900,1000),anchorOffsetY(2,90,100)));
test('sprite with feet on bottom has no correction',()=>assert.equal(anchorOffsetY(3,1000,1000),0));
test('invalid anchor is rejected',()=>assert.throws(()=>anchorOffsetY(2,101,100),RangeError));
