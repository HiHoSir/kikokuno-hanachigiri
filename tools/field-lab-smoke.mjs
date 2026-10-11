import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results',{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,args:name==='chromium'?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8765/field-lab/');await page.waitForFunction(()=>window.__kikokuRendered,null,{timeout:45000});
 await page.screenshot({path:`test-results/${name}-candidate.png`});
 assert.equal(await page.evaluate(()=>__kikokuLab.version),'0.9.0-lab');
 for(const [dir,keys] of [[0,['ArrowDown']],[1,['ArrowRight','ArrowDown']],[2,['ArrowRight']],[3,['ArrowRight','ArrowUp']],[4,['ArrowUp']],[5,['ArrowLeft','ArrowUp']],[6,['ArrowLeft']],[7,['ArrowLeft','ArrowDown']]]){
  for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(140);
  const m=await page.evaluate(()=>window.__kikokuLab);assert.equal(m.direction,dir);assert.ok(m.distance>0);
  for(const k of keys)await page.keyboard.up(k);
 }
 await page.waitForTimeout(100);const phase=await page.evaluate(()=>__kikokuLab.phase);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__kikokuLab.phase),phase);
 // Drag the actual touch pad towards screen left, checking UI and art agree.
 const pad=await page.locator('#dpad').boundingBox();await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();await page.mouse.move(pad.x+10,pad.y+pad.height/2);await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>__kikokuLab.direction),6);await page.mouse.up();
 await page.selectOption('#source','1');await page.waitForTimeout(100);await page.screenshot({path:`test-results/${name}-v06.png`});
 assert.match(await page.evaluate(()=>__kikokuLab.source),/v0.6/);assert.equal(await page.evaluate(()=>localStorage.getItem('kikoku-game-state-v1')),null);assert.deepEqual(errors,[]);
 await browser.close();console.log(name+' mobile viewport smoke passed');
}
