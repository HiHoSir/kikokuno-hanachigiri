import test from 'node:test';
import assert from 'node:assert/strict';
import {demoArea} from '../src/areas/demo.js';
import {createGameState,getNearestInteraction,interact} from '../src/events.js';
test('area definition is independent from display dimensions',()=>{assert.equal(demoArea.spawn.z,3.6);assert.ok(demoArea.blocks.length>10)});
test('nearest interaction is selected within range',()=>{const s=createGameState(demoArea);s.player={x:5,z:1};assert.equal(interact(demoArea,s).id,'stone')});
test('outside interactions falls back to ambient text',()=>{const s=createGameState(demoArea);s.player={x:12,z:12};assert.equal(interact(demoArea,s).id,null)});
test('once-only events set flags',()=>{const a={id:'test',spawn:{x:0,z:0},interactions:[{id:'once',x:0,z:0,range:1,trigger:'action',once:true,text:'hello'}]};const s=createGameState(a);assert.equal(interact(a,s).id,'once');assert.equal(s.flags['test:once'],true);assert.equal(getNearestInteraction(a,s.player,s),null)});
