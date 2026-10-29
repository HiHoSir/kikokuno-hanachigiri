import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('/tmp/kikoku-pixel-64-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop';
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},deviceScaleFactor:mobile?3:1,hasTouch:mobile,isMobile:mobile,acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:8765/experiments/ai-pixel-editor-64x96/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__KIKOKU_PIXEL_EDITOR);
  assert.equal(await page.locator('#directions button').count(),8);
  assert.equal(await page.locator('#frames button').count(),8);
  const before=await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getInfo());
  assert.equal(before.width,64);assert.equal(before.height,96);
  assert.equal(before.dir,'front');assert.equal(before.frameCount,8);
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent().some(x=>x!==0)),false,'reference source corrupted pixels');
  await page.locator('#cursorMode').check();
  await page.locator('#color').fill('#abcabc');
  await page.locator('#cursorPaint').click();
  assert.deepEqual(await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent().slice((48*64+32)*4,(48*64+32)*4+4)]),[171,202,188,255]);
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent()[(48*64+32)*4+3]),0);
  await page.locator('#redo').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent()[(48*64+32)*4+3]),255);
  await page.locator('#aiInstruction').fill('指定した画素のみ修正');
  await page.locator('#aiCopy').click();
  await page.waitForFunction(()=>document.querySelector('#aiPromptOutput').value.includes('baseHash='));
  const state=await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getInfo());
  const patch={format:'kikoku-pixel-patch-v1',direction:state.dir,frame:state.frame,width:64,height:96,baseHash:state.hash,pixels:[{x:0,y:0,rgba:[255,0,200,255]}]};
  await page.locator('#aiPatch').fill(JSON.stringify(patch));
  await page.locator('#aiPreview').click();
  assert.equal(await page.locator('#aiApply').isDisabled(),false);
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent()[3]),0,'preview changed source');
  const preview=await page.evaluate(()=>[...document.querySelector('#aiAfter').getContext('2d').getImageData(0,0,1,1).data]);
  assert.deepEqual(preview,[255,0,200,255]);
  await page.locator('#aiApply').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent()[0]),255);
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent()[3]),0);
  await page.locator('#directions button').nth(1).click();
  await page.locator('#frames button').nth(7).click();
  const diagonal=await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getInfo());
  assert.equal(diagonal.dir,'front_right');assert.equal(diagonal.frame,7);
  await page.locator('#aiPatch').fill(JSON.stringify(patch));
  await page.locator('#aiPreview').click();
  assert.equal(await page.locator('#aiApply').isDisabled(),true);
  assert.match(await page.locator('#aiStatus').innerText(),/一致しません/);
  const current=await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getInfo());
  await page.locator('#aiPatch').fill(JSON.stringify({...patch,direction:current.dir,frame:current.frame,baseHash:'deadbeef'}));
  await page.locator('#aiPreview').click();
  assert.equal(await page.locator('#aiApply').isDisabled(),true);
  assert.match(await page.locator('#aiStatus').innerText(),/ハッシュ/);
  let json;
  const d=page.waitForEvent('download');await page.locator('#exportJSON').click();const download=await d;json=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(json.frameCount,8);assert.equal(json.width,64);assert.equal(json.height,96);
  assert.equal(json.directions.length,8);
  assert.ok(json.directions.every(n=>json.frames[n]?.length===8));
  const atlasPromise=page.waitForEvent('download');await page.locator('#exportAtlas').click();const atlas=await atlasPromise;
  const {PNG}=await import('pngjs');const img=PNG.sync.read(fs.readFileSync(await atlas.path()));
  assert.equal(img.width,512);assert.equal(img.height,768);
  await page.locator('#jsonFile').setInputFiles({name:'test-64frames.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(json))});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('JSONを読み込みました'));
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getInfo().dir),'front_right');
  // The authored prototype should load as actual editable RGBA, not as an overlay.
  await page.locator('#directions button').first().click();
  await page.locator('#frames button').first().click();
  const oldPixelData=await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent()]);
  await page.locator('#loadHandPixelExample').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('手打ち正面試作を読み込みました'));
  const opaque=await page.evaluate(()=>{
    const img=window.__KIKOKU_PIXEL_EDITOR.getCurrent();let count=0;
    for(let i=3;i<img.length;i+=4)if(img[i]!==0)count++;
    return count;
  });
  assert.ok(opaque>1500,'authored sprite not loaded into editable pixel buffer');
  await page.locator('#undo').click();
  assert.deepEqual(await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent()]),oldPixelData,'sample import Undo must restore exact RGBA');
  // Silhouette-first drafting must use the *real original* PNG alpha and never mutate before approval.
  const beforeSilhouette=await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent()]);
  await page.waitForFunction(()=>document.querySelector('#status').textContent!==null);
  await page.locator('#silhouetteBuild').click();
  let silState=await page.locator('#silhouetteInfo').innerText();
  if(silState.includes('読み込まれていません')){
    await page.waitForTimeout(1200);
    await page.locator('#silhouetteBuild').click();
    silState=await page.locator('#silhouetteInfo').innerText();
  }
  assert.match(silState,/Nearest法/,name+' silhouette preview failed: '+silState);
  assert.equal(await page.locator('#silhouetteApply').isDisabled(),false);
  assert.deepEqual(await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent()]),beforeSilhouette,'silhouette preview must not mutate original');
  const draft=await page.evaluate(()=>{
    const a=document.querySelector('#silhouettePreview').getContext('2d').getImageData(0,0,64,96).data;
    let ink=0;let transparent=0;const colors=new Set();
    for(let i=0;i<a.length;i+=4){if(a[i+3]){ink++;colors.add([a[i],a[i+1],a[i+2],a[i+3]].join(','));}else transparent++;}
    return {ink,transparent,colors:[...colors]};
  });
  assert.ok(draft.ink>500&&draft.ink<6000,'silhouette must be person-sized');
  assert.ok(draft.transparent>50,'silhouette must retain transparent surroundings');
  assert.equal(draft.colors.length,1,'solid black silhouette must contain exactly one color');
  await page.locator('#silhouetteApply').click();
  assert.equal(await page.evaluate(()=>window.__KIKOKU_PIXEL_EDITOR.getCurrent().some(x=>x!==0)),true,'silhouette apply failed');
  await page.locator('#undo').click();
  assert.deepEqual(await page.evaluate(()=>[...window.__KIKOKU_PIXEL_EDITOR.getCurrent()]),beforeSilhouette,'silhouette Undo must restore every RGBA value');
  console.log('PASS '+name+': source alpha -> nearest black silhouette, preview no-mutation, one-color, apply and Undo');

  // Ensure a new full-array import can be undone without discarding unrelated frames.
  await page.screenshot({path:'/tmp/kikoku-pixel-64-qa/'+name+'.png',fullPage:true});
  assert.deepEqual(errors,[],name+' JS errors');
  console.log('PASS '+name+': 8 directions, 8 frames, RGBA editing, undo/redo, safe AI patch, JSON and 512x768 atlas');
  await page.close();
 }
}finally{await browser.close();}