import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results',{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,args:name==='chromium'?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('requestfailed',r=>console.error(r.url(),r.failure()));
 const inspect=page.locator('#inspect');
 async function open(){await inspect.evaluate(el=>el.open=true)}
 async function close(){await inspect.evaluate(el=>el.open=false)}
 await page.goto('http://localhost:8765/field-lab/');await page.waitForFunction(()=>window.__kikokuRendered,null,{timeout:45000});
 await page.screenshot({path:`test-results/${name}-candidate.png`});
 assert.equal(await page.evaluate(()=>__kikokuLab.version),'0.11.0-lab');
 for(const [dir,keys] of [[0,['ArrowDown']],[1,['ArrowRight','ArrowDown']],[2,['ArrowRight']],[3,['ArrowRight','ArrowUp']],[4,['ArrowUp']],[5,['ArrowLeft','ArrowUp']],[6,['ArrowLeft']],[7,['ArrowLeft','ArrowDown']]]){
  for(const k of keys)await page.keyboard.down(k);await page.waitForFunction(dir=>window.__kikokuLab.direction===dir&&window.__kikokuLab.moving,dir,{timeout:10000});
  const m=await page.evaluate(()=>window.__kikokuLab);assert.equal(m.direction,dir);assert.ok(m.distance>0);assert.ok(m.stance.some(Boolean));
  for(const k of keys)await page.keyboard.up(k);
 }
 await page.waitForFunction(()=>!window.__kikokuLab.moving);const phase=await page.evaluate(()=>__kikokuLab.phase);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__kikokuLab.phase),phase);
 await page.waitForFunction(()=>__kikokuLab.rigBlend<.005);
 const pad=await page.locator('#dpad').boundingBox();await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();await page.mouse.move(pad.x+10,pad.y+pad.height/2);await page.waitForFunction(()=>window.__kikokuLab.direction===6&&window.__kikokuLab.moving,null,{timeout:10000});await page.mouse.up();
 for(const [key,height] of [['clear',-.015],['front',.015],['behind',-.015],['cushion',.135],['edge',.135],['floor',.015]]){
  await open();await page.selectOption('#scenario',key);await page.waitForFunction(key=>__kikokuLab.scenario===key,key);await close();
  const m=await page.evaluate(()=>__kikokuLab);assert.equal(m.feetY,height);assert.equal(m.depthMode,'upright');if(key==='edge')assert.ok(m.shadowTriangles<800);
  await page.screenshot({path:`test-results/${name}-${key}.png`});
 }
 // Walk down from a raised surface using the real D-pad/production movement path.
 await open();await page.selectOption('#scenario','cushion');await close();await page.keyboard.down('ArrowDown');
 await page.waitForFunction(()=>__kikokuLab.feetY===.015,null,{timeout:10000});await page.keyboard.up('ArrowDown');
 await open();await page.selectOption('#scenario','clear');await page.locator('#pose').check();
 for(let dir=0;dir<8;dir++){
  await open();await page.selectOption('#direction',String(dir));await page.locator('#phase').fill('75');
  await page.waitForFunction(dir=>__kikokuLab.direction===dir&&__kikokuLab.pose&&Math.abs(__kikokuLab.phase-Math.PI*1.5)<1e-8,dir);await close();
  assert.ok((await page.evaluate(()=>__kikokuLab.footLift)).some(x=>x>.05));
  assert.equal(await page.evaluate(()=>__kikokuLab.reusedFarLeg),dir===2||dir===6);
  await page.screenshot({path:`test-results/${name}-direction-${dir}.png`});
 }
 await page.mouse.move(pad.x+10,pad.y+pad.height/2);await page.mouse.down();await page.waitForFunction(()=>!__kikokuLab.pose&&__kikokuLab.moving);await page.mouse.up();
 await open();await page.selectOption('#direction','0');await page.locator('#pose').check();await close();
 for(const action of ['surprise','wave','bow','cheer']){
  await page.locator('#'+action).tap();await page.waitForFunction(action=>__kikokuLab.action===action&&__kikokuLab.actionStrength>.8,action);
  assert.equal(await page.evaluate(()=>__kikokuLab.pose),false);
  await page.screenshot({path:`test-results/${name}-action-${action}.png`});
  await page.waitForFunction(()=>__kikokuLab.action==='idle');
 }
 await page.keyboard.down('ArrowDown');await page.locator('#surprise').tap();await page.waitForFunction(()=>__kikokuLab.moving&&__kikokuLab.action==='surprise'&&__kikokuLab.actionStrength>.8);await page.keyboard.up('ArrowDown');
 await open();await page.locator('#pose').uncheck();await page.selectOption('#source','1');await page.waitForFunction(()=>__kikokuLab.source.includes('v0.6'));await close();await page.screenshot({path:`test-results/${name}-v06.png`});
 assert.equal(await page.evaluate(()=>localStorage.getItem('kikoku-game-state-v1')),null);assert.deepEqual(errors,[]);
 await browser.close();console.log(name+' mobile movement, terrain, pose and save checks passed');
}
