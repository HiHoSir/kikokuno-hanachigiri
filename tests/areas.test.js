import test from 'node:test';
import assert from 'node:assert/strict';
import {demoArea} from '../src/areas/demo.js';
import {outdoorArea} from '../src/areas/outdoor.js';
import {resolveArea} from '../src/areas/registry.js';
import {applyTransition} from '../src/transitions.js';
import {createGameState,interact} from '../src/events.js';
import {surfaceHeightAt} from '../src/surfaces.js';
test('two areas have distinct geometry',()=>assert.notEqual(demoArea.blocks,outdoorArea.blocks));
test('tea shop portal leads outside and back',()=>{
 const state=createGameState(demoArea);
 let action=interact(demoArea,state);
 assert.equal(action.id,'teahouse-exit');
 let area=applyTransition(state,action,resolveArea);
 assert.equal(area.id,'outdoor-path');
 assert.equal(state.player.z,3.8);
 action=interact(area,state);
 area=applyTransition(state,action,resolveArea);
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
