import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

fs.mkdirSync('/tmp/kikoku-ai-pixel-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const kind of ['mobile','desktop']){
  const mobile=kind==='mobile';
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:8765/experiments/ai-pixel-editor/index.html',{waitUntil:'load'});
  assert.match(await page.locator('#aiStatus').innerText(),/32×32/);
  assert.equal(await page.locator('#aiApply').isDisabled(),true);
  await page.locator('#aiLoadHizuki').click();
  await page.waitForFunction(()=>document.querySelector('#aiStatus').textContent.includes('読み込みました'),{timeout:10000});
  await page.locator('#direction0').click();
  await page.locator('#pose0').click();
  await page.locator('#aiPatch').fill(JSON.stringify({
   format:'yaksha-pixel-patch-v1', direction:'front',pose:'idle',
   pixels:[{x:0,y:0,rgba:[255,0,255,255]}]
  }));
  await page.locator('#aiPreview').click();
  assert.equal(await page.locator('#aiApply').isDisabled(),false);
  const before=await page.evaluate(()=>[...document.getElementById('aiBefore').getContext('2d').getImageData(0,0,1,1).data]);
  assert.equal(before[3],0,'original first corner was unexpectedly painted');
  const proposed=await page.evaluate(()=>[...document.getElementById('aiAfter').getContext('2d').getImageData(0,0,1,1).data]);
  assert.deepEqual(proposed,[255,0,255,255],'preview did not paint selected pixel');
  await page.locator('#aiApply').click();
  const applied=await page.evaluate(()=>[...document.getElementById('preview').getContext('2d').getImageData(0,0,1,1).data]);
  assert.deepEqual(applied,[255,0,255,255],'apply did not change editor frame');
  await page.locator('#undo').click();
  const undone=await page.evaluate(()=>[...document.getElementById('preview').getContext('2d').getImageData(0,0,1,1).data]);
  assert.equal(undone[3],0,'undo did not restore image');
  await page.locator('#aiPatch').fill(JSON.stringify({
   format:'yaksha-pixel-patch-v1',direction:'back',pose:'idle',pixels:[{x:0,y:0,rgba:[255,0,255,255]}]
  }));
  await page.locator('#aiPreview').click();
  assert.equal(await page.locator('#aiApply').isDisabled(),true);
  assert.match(await page.locator('#aiStatus').innerText(),/一致しません/);
  await page.screenshot({path:'/tmp/kikoku-ai-pixel-qa/'+kind+'.png',fullPage:true});
  assert.deepEqual(errors,[],'uncaught page errors');
  console.log('PASS '+kind+': load, compare, patch, undo, reject wrong direction, no runtime errors');
  await page.close();
 }
}finally{await browser.close()}
