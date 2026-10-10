import test from 'node:test';
import assert from 'node:assert/strict';
import {crossingPortal} from '../src/portals.js';
import {demoArea} from '../src/areas/demo.js';
import {outdoorArea} from '../src/areas/outdoor.js';
import {createGameState} from '../src/events.js';
import {applyTransition} from '../src/transitions.js';
import {resolveArea} from '../src/areas/registry.js';
import {encodeSave,decodeSave} from '../src/save.js';
test('crossing entrance switches map without pressing action',()=>{
 const state=createGameState(demoArea);
 const portal=crossingPortal(demoArea,{x:0,z:4.2},{x:0,z:4.6});
 assert.equal(portal?.to,outdoorArea.id);
 const arrived=applyTransition(state,{transition:{to:portal.to,spawn:portal.spawn}},resolveArea);
 assert.equal(arrived.id,outdoorArea.id);
 assert.equal(crossingPortal(arrived,state.player,state.player),null);
});
test('remaining inside portal does not immediately transition',()=>{
 assert.equal(crossingPortal(demoArea,{x:0,z:4.6},{x:0,z:4.8}),null);
});
test('walking back into return entrance works',()=>{
 const portal=crossingPortal(outdoorArea,{x:0,z:4.2},{x:0,z:4.6});
 assert.equal(portal?.to,demoArea.id);
});
test('save codec retains map player location and NPC flags',()=>{
 const state={areaId:outdoorArea.id,player:{x:1.8,z:1.3},flags:{metOwner:true,metTraveler:true}};
 assert.deepEqual(decodeSave(encodeSave(state),resolveArea),state);
});
test('invalid, outdated, and unknown area saves fail safely',()=>{
 assert.equal(decodeSave('{oops',resolveArea),null);
 assert.equal(decodeSave('{"version":2}',resolveArea),null);
 assert.equal(decodeSave(encodeSave({areaId:'unknown',player:{x:0,z:0},flags:{}}),resolveArea),null);
});
