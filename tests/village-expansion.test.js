import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateMap,canStand,findPath,groundTiles} from '../src/map/logic.js';
import {MapRenderer} from '../src/map/renderer.js';
const map=JSON.parse(fs.readFileSync('maps/village/map.json'));
// Synthetic extended map keeps generic multi-ground support tested without shipping a northern district.
const original=structuredClone(map);
map.bounds[1]=-15.930611987050623;
map.ground.tiles=[{image:map.ground.image,size:map.ground.size,offset:[0,-1024]}];
map.surfaces.push({id:'test-north',polygon:[[0,-15.93],[11,-15.93],[11,0],[0,0]]});
test('single original ground stays unchanged and optional multi-ground layout validates',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('maps/village/assets/ground.png')).digest('hex'),'2d1cc92f86d7a64c1d3b063773e1bf9785a6febb1f38930b661fd5c7dfef5259');
 assert.equal(groundTiles(original).length,1);
 validateMap(map);
});
test('extra ground metadata rejects missing offsets, unsafe paths and oversized decoded images',()=>{
 for(const change of [m=>delete m.ground.tiles[0].offset,m=>m.ground.tiles[0].image='../old/ground.png',m=>m.ground.tiles[0].size=[50000,50000]]){
  const candidate=structuredClone(map);assert.ok(candidate.ground.tiles);change(candidate);assert.throws(()=>validateMap(candidate));
 }
});
test('camera follows northern world coordinates and overview covers both ground chunks',()=>{
 const hero=JSON.parse(fs.readFileSync('assets/characters/hizuki-v35/character.json'));
 const r=new MapRenderer({getContext:()=>({})});r.resize=()=>{};r.width=852;r.height=393;
 r.updateCamera(map,{x:6,z:-10},hero,false);assert.ok(r.camera.y<0);
 r.updateCamera(map,map.spawn,hero,true);
 for(const point of [{x:0,z:map.bounds[1]},{x:15.36,z:map.bounds[3]}]){const p=r.toScreen(point,map);assert.ok(p.x>=0&&p.x<=852&&p.y>=0&&p.y<=393);}
});

test('ground tile dimensions match PNG headers and legacy single-ground maps still validate',()=>{
 for(const tile of groundTiles(map)){
  const data=fs.readFileSync('maps/village/'+tile.image);assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],tile.size);
 }
 const legacy=structuredClone(map);delete legacy.ground.tiles;assert.equal(groundTiles(legacy).length,1);validateMap(legacy);
});
