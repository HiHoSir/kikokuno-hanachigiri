import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMap,canStand,findPath,groundTiles} from '../src/map/logic.js';
const map=JSON.parse(fs.readFileSync('maps/village/map.json'));
test('village returns to original bounds without an accessible northern district',()=>{
 assert.deepEqual(map.bounds,[0,0,15.36,15.930611987050623]);
 assert.equal(groundTiles(map).length,1);
 assert.equal(canStand(map,6,-.5),false);
 assert.equal(findPath(map,map.spawn,{x:6,z:-.5}).length,0);
 validateMap(map);
});
test('all remaining doors and bridge-side exit remain reachable after garden dressing',()=>{
 for(const p of map.landmarks){assert.ok(canStand(map,p.x,p.z),p.id);assert.ok(findPath(map,map.spawn,p).length,p.id);}
 assert.ok(findPath(map,map.spawn,{x:14.7,z:10.65}).length);
 assert.equal(canStand(map,13,6),false);
});
