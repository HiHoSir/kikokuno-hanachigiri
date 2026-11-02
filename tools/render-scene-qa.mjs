// Optional native Canvas visual checks; the game uses this same MapRenderer.
// NODE_MODULES path can be set explicitly when @napi-rs/canvas is not local.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {MapRenderer} from '../src/map/renderer.js';
import {MotionPlayer} from '../src/map/motion.js';
const require=createRequire(import.meta.url);
let canvasModule;try{canvasModule=require('@napi-rs/canvas');}catch{canvasModule=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas,loadImage}=canvasModule;
const map=JSON.parse(fs.readFileSync('maps/village/map.json')),config=JSON.parse(fs.readFileSync('assets/characters/hizuki-v35/character.json'));
global.window={devicePixelRatio:2};
const images=new Map();for(const p of [map.ground.image,...Object.values(map.assets).map(a=>a.image)])images.set(p,await loadImage('maps/village/'+p));
const hero={config,images:new Map()};for(const p of ['normal.png',...Object.values(config.motions).map(m=>m.image)])hero.images.set(p,await loadImage('assets/characters/hizuki-v35/'+p));
fs.mkdirSync('test-results',{recursive:true});
for(const [name,player,facing,overview,debug] of [
 ['door',{x:3.35,z:6.85},'back',false,false],
 ['door-debug',{x:3.35,z:6.85},'back',false,true],
 ['overview',{...map.spawn},'front_right',true,false],
 ['overview-debug',{...map.spawn},'front_right',true,true]
]){
 const width=overview?1000:393,height=overview?800:635,canvas=createCanvas(width*2,height*2);canvas.getBoundingClientRect=()=>({width,height});
 const renderer=new MapRenderer(canvas),motion=new MotionPlayer(config);motion.update(0,{facing});
 renderer.draw(map,images,hero,player,{overview,debug,motion:motion.current,facing});
 fs.writeFileSync('test-results/scene-'+name+'.png',canvas.toBuffer('image/png'));
}
console.log('Rendered current scene with real renderer: doorway, overview and collision overlays.');
