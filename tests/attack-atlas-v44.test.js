import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const root='assets/characters/hizuki/v35-expanded-cells/';
const config=JSON.parse(fs.readFileSync('assets/characters/hizuki-v35/character.json','utf8'));
const qa=JSON.parse(fs.readFileSync('tools/hizuki-attack-v44/atlas_qa_corrected.json','utf8'));
const directions=['front','front_right','right','back_right','back','back_left','left','front_left'];
const expectedYaw=[0,-45,-90,-135,180,135,90,45];

test('v44 corrected: facing right points screen-right, facing left points screen-left',()=>{
 assert.deepEqual(qa.directions,directions);
 assert.deepEqual(qa.cameraYawDeg,expectedYaw);
 for(const [i,yawDeg]of expectedYaw.entries()){
  const d=directions[i];
  const screenRightComponent=-Math.sin(yawDeg*Math.PI/180); // GLB local +Z forward
  if(d.includes('right'))assert.ok(screenRightComponent>0.5,`${d} camera yaw ${yawDeg} should face right`);
  if(d.includes('left'))assert.ok(screenRightComponent<-.5,`${d} camera yaw ${yawDeg} should face left`);
 }
});

test('v44 corrected: raster scale matches approved 108 px tall idle reference',()=>{
 const atlas=config.motions.attack_katana;
 assert.equal(atlas.image,'../hizuki/v35-expanded-cells/attack_katana_v44_corrected_8dir.png');
 assert.equal(atlas.durationMs,1100);
 assert.equal(atlas.frames,8);
 assert.deepEqual(atlas.size,[224,256]);
 assert.deepEqual(atlas.directions,directions);
 assert.equal(atlas.smooth,true);
 assert.equal(qa.camera.sourceModelHeightToPixels,60);
 assert.deepEqual(qa.runtimeAnchor,atlas.anchor);
 assert.deepEqual(qa.registrationCorrectionPx,[-2,-4]);
 const first=qa.bboxes.find(x=>x.dir==='front_right'&&x.frame===0);
 assert.equal(first.bbox[3]-first.bbox[1],108);
 assert.equal(qa.nonempty,64);
 assert.equal(qa.clipped,0);
 for(const b of qa.bboxes){
  assert.ok(b.alpha>0,`${b.dir}/${b.frame} unexpectedly empty`);
  assert.ok(b.bbox[0]>2&&b.bbox[1]>2&&b.bbox[2]<atlas.size[0]-2&&b.bbox[3]<atlas.size[1]-2,`${b.dir}/${b.frame} clipped`);
 }
});

test('v44 corrected: committed RGBA image matches the audited bytes',()=>{
 const p=root+'attack_katana_v44_corrected_8dir.png';
 const file=fs.readFileSync(p);
 assert.equal(file.toString('hex',0,8),'89504e470d0a1a0a');
 assert.deepEqual([file.readUInt32BE(16),file.readUInt32BE(20)],[1792,2048]);
 assert.equal(createHash('sha256').update(file).digest('hex'),qa.sheetSHA256);
});