import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {MotionPlayer} from '../src/map/motion.js';
import {drawCharacterFrame} from '../src/map/character-visual.js';

const config=JSON.parse(await fs.readFile(new URL('../assets/characters/hizuki-v35/character.json',import.meta.url),'utf8'));

test('shared demo motion tracks current idle/walk/run atlas contract',()=>{
 const player=new MotionPlayer(config);
 player.update(200,{moving:false,facing:'back',distance:0});
 let frame=player.current;
 assert.equal(frame.image,config.motions.idle.image);
 assert.equal(frame.rect[2],config.motions.idle.size[0]);
 assert.equal(frame.rect[3],config.motions.idle.size[1]);
 assert.deepEqual(frame.anchor,config.motions.idle.anchor);
 player.update(16,{moving:true,facing:'right',running:false,distance:config.motions.walking.strideMetres/4});
 frame=player.current;
 assert.equal(frame.id,'walking');
 assert.equal(frame.frame,2);
 assert.equal(frame.rect[0],config.motions.walking.size[0]*2);
 assert.deepEqual(frame.anchor,config.motions.walking.anchor);
 player.update(16,{moving:true,facing:'right',running:true,distance:config.motions.running.strideMetres/8});
 frame=player.current;
 assert.equal(frame.id,'running');
 assert.equal(frame.image,config.motions.running.image);
 assert.deepEqual(frame.anchor,config.motions.running.anchor);
});

test('shared draw preserves model-origin anchor and smoothing',()=>{
 const calls=[],image={};
 const ctx={
  save:()=>calls.push('save'),
  restore:()=>calls.push('restore'),
  drawImage:(...args)=>calls.push(args),
  imageSmoothingEnabled:false,imageSmoothingQuality:'low'
 };
 const player=new MotionPlayer(config);
 const f=player.current;
 const hero={config,images:new Map([[f.image,image]])};
 drawCharacterFrame(ctx,hero,f,{x:300,y:400});
 const expected=[image,...f.rect,300-f.anchor[0]*config.scale,400-f.anchor[1]*config.scale,f.rect[2]*config.scale,f.rect[3]*config.scale];
 assert.deepEqual(calls[1],expected);
 assert.deepEqual([calls[0],calls[2]],['save','restore']);
 assert.equal(ctx.imageSmoothingEnabled,f.smooth===true||!config.pixelArt);
});

test('a missing atlas is not silently replaced by obsolete cells',()=>{
 assert.throws(()=>drawCharacterFrame({save(){},restore(){},drawImage(){}},{config,images:new Map()},{image:'missing.png',rect:[0,0,80,132]},{x:0,y:0}),/読み込まれていません/);
});
