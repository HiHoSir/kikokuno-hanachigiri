import test from 'node:test';
import assert from 'node:assert/strict';
import {checkAtlas} from '../tools/hizuki-attack-v44/lighting_audit.mjs';

const baselines = [
  ['idle','assets/characters/hizuki/v35-expanded-cells/idle_8dir.png',80,132],
  ['walking','assets/characters/hizuki/v35-expanded-cells/walking_8dir.png',80,160],
  ['running','assets/characters/hizuki/v35-expanded-cells/running_8dir.png',96,160],
  ['katana-v44','assets/characters/hizuki/v35-expanded-cells/attack_katana_v44_lightmatched_8dir.png',224,256],
];
test('character lighting audit: compare original idle/walk/run and new v44 colors',()=>{
  const samples=[];
  for (const [name,file,w,h] of baselines){
    const image=checkAtlas(name,file,w,h);
    assert.deepEqual(image.dimensions,[w*8,h*8]);
    for(const direction of ['front','front_right','right','back']){
      const stats=image.directions[direction].stats;
      assert.ok(stats['top45-blue'].n>50,`${name}/${direction} no hair colour samples`);
      assert.ok(stats['upper55-red'].n>25,`${name}/${direction} no red costume samples`);
      samples.push({motion:name,direction,height:image.directions[direction].bboxHeight,
        hairY:stats['top45-blue'].Y,hairRGB:stats['top45-blue'].RGB,
        redY:stats['upper55-red'].Y,redRGB:stats['upper55-red'].RGB});
    }
  }
  console.log('LIGHTING_AUDIT_MEASUREMENTS '+JSON.stringify(samples));
  // Intentional baseline collection: geometry and pose differ; raw mean luminance
  // is an observation, not proof of illumination equivalence. Do not make a
  // spurious pass/fail assertion on the means before a same-pose control exists.
});
test('v44 final sprite hair/red luminance matches the approved idle/walk/run reference in four directions',()=>{
  const dirNames=['front','front_right','right','back'];
  const sheets=baselines.map(([name,file,w,h])=>checkAtlas(name,file,w,h));
  const yValues=(o,d,kind)=>o.directions[d].stats[kind].Y;
  for(const d of dirNames){
    for(const kind of ['top45-blue','upper55-red']){
      const target=sheets.slice(0,3).map(s=>yValues(s,d,kind)).reduce((a,b)=>a+b,0)/3;
      const actual=yValues(sheets[3],d,kind);
      assert.ok(Math.abs(actual-target)<=5,`${d}/${kind}: got ${actual} but baseline mean ${target.toFixed(2)}`);
    }
  }
});
test('v44 lighting change preserves the entire sprite alpha channel and all frame geometry',async()=>{
  const {pngPixels}=await import('../tools/hizuki-attack-v44/lighting_audit.mjs');
  const path='assets/characters/hizuki/v35-expanded-cells/';
  const baseline=pngPixels(path+'attack_katana_v44_corrected_8dir.png');
  const revised=pngPixels(path+'attack_katana_v44_lightmatched_8dir.png');
  assert.deepEqual([revised.width,revised.height],[baseline.width,baseline.height]);
  for(let i=3;i<baseline.pixels.length;i+=4)assert.equal(revised.pixels[i],baseline.pixels[i],`alpha changed at pixel ${Math.floor(i/4)}`);
});
