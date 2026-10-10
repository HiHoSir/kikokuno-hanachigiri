import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceHeightAt} from '../src/surfaces.js';
import {demoArea} from '../src/areas/demo.js';
test('teahouse wood floor wins over underlying ground',()=>assert.equal(surfaceHeightAt(demoArea,0,0),.015));
test('grass contact remains above grass surface',()=>assert.equal(surfaceHeightAt(demoArea,7,7),-.015));
test('fallback ground outside defined surfaces',()=>assert.equal(surfaceHeightAt({shadowSurfaces:[]},0,0),0));
test('floor edge remains inside designated rectangle',()=>assert.equal(surfaceHeightAt(demoArea,2.5,0),.015));

test('cushion lifts the shared foot and shadow elevation',()=>assert.equal(surfaceHeightAt(demoArea,-.7,.85),.135));
test('next to cushion stays on the wooden floor',()=>assert.equal(surfaceHeightAt(demoArea,-.7,1.3),.015));
