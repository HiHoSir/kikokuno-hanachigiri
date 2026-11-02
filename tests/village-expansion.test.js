import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateMap,canStand,findPath,groundTiles} from '../src/map/logic.js';
import {MapRenderer} from '../src/map/renderer.js';
const map=JSON.parse(fs.readFileSync('maps/village/map.json'));
test('north expansion preserves the original ground and coordinate references',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('maps/village/assets/ground.png')).digest('hex'),'2d1cc92f86d7a64c1d3b063773e1bf9785a6febb1f38930b661fd5c7dfef5259');
 assert.ok(map.bounds[1]<-15);assert.equal(map.instances.find(i=>i.id==='bridge-east').z,10.65);
 assert.equal(map.ground.tiles.length,1);assert.deepEqual(map.ground.tiles[0].offset,[0,-1024]);
 validateMap(structuredClone(map));
});
test('old village, plaza, four new doors and northern road are connected while river stays blocked',()=>{
 for(const id of ['plaza-north','door-north-west','door-north-east','door-upper-west','door-upper-east','exit-north']){
  const point=map.landmarks.find(p=>p.id===id);assert.ok(point,id);
  assert.ok(canStand(map,point.x,point.z,.16),id);assert.ok(findPath(map,map.spawn,point,.16).length,id);
 }
 assert.ok(findPath(map,{x:6,z:-13},{x:14.7,z:10.65},.16).length);
 for(const z of [-.01,0,.01])assert.ok(canStand(map,6.1,z,.16));
 assert.equal(canStand(map,12.6,-6,.16),false);
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
