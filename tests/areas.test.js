import test from 'node:test';
import assert from 'node:assert/strict';
import {demoArea} from '../src/areas/demo.js';
import {outdoorArea} from '../src/areas/outdoor.js';
import {resolveArea} from '../src/areas/registry.js';
import {applyTransition} from '../src/transitions.js';
import {createGameState,interact} from '../src/events.js';
import {crossingPortal} from '../src/portals.js';
import {surfaceHeightAt} from '../src/surfaces.js';
test('two areas have distinct geometry',()=>assert.notEqual(demoArea.blocks,outdoorArea.blocks));
test('tea shop portal leads outside and back',()=>{
 const state=createGameState(demoArea);
 const departure=crossingPortal(demoArea,{x:0,z:4.2},{x:0,z:4.6});
 assert.equal(departure.id,'exit');
 let area=applyTransition(state,{transition:{to:departure.to,spawn:departure.spawn}},resolveArea);
 assert.equal(area.id,'outdoor-path');
 assert.equal(state.player.z,3.2);
 const returning=crossingPortal(area,{x:0,z:4.2},{x:0,z:4.6});
 area=applyTransition(state,{transition:{to:returning.to,spawn:returning.spawn}},resolveArea);
 assert.equal(area.id,'prototype-teahouse');
});
test('outdoor NPC conversation updates flag and dialogue',()=>{
 const state=createGameState(outdoorArea);state.player={x:1.8,z:1.3};
 assert.equal(interact(outdoorArea,state).changed,true);
 assert.equal(state.flags.metTraveler,true);
 assert.match(interact(outdoorArea,state).text,/また会いましたね/);
});
test('height map persists after transitions',()=>{
 assert.equal(surfaceHeightAt(demoArea,-.7,.85),.135);
 assert.equal(surfaceHeightAt(outdoorArea,0,0),-.015);
});
