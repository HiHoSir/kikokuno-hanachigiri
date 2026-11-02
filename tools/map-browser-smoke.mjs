import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.MAP_TEST_URL||'http://127.0.0.1:8765/';
fs.mkdirSync('test-results',{recursive:true});const results=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 for(const [orientation,viewport] of [['portrait',{width:393,height:852}],['landscape',{width:852,height:393}]]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base);await page.waitForFunction(()=>window.__mapLab?.getState().ready);
   await page.getByRole('button',{name:'全景',exact:true}).click();
   await page.screenshot({path:`test-results/${name}-${orientation}-overview.png`});
   assert.equal(await page.evaluate(()=>window.innerWidth>=document.documentElement.scrollWidth),true);
   const target={x:14.7,z:10.65};const screen=await page.evaluate(p=>window.__mapLab.toScreen(p),target);
   await page.touchscreen.tap(screen.x,screen.y);
   await page.waitForFunction(p=>{const s=window.__mapLab.getState();return Math.hypot(s.player.x-p.x,s.player.z-p.z)<.12;},target,{timeout:15000});
   await page.screenshot({path:`test-results/${name}-${orientation}-bridge.png`});
   const previous=await page.evaluate(()=>window.__mapLab.getState().player);
   const river=await page.evaluate(()=>window.__mapLab.toScreen({x:13,z:6}));await page.touchscreen.tap(river.x,river.y);
   await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('歩いて行けません'));
   assert.ok(await page.evaluate(p=>{const q=window.__mapLab.getState().player;return Math.hypot(p.x-q.x,p.z-q.z)<.15;},previous));
   // JSON round trip includes harmless spawn metadata: it must not become a render ID.
   await page.evaluate(async()=>{const m=window.__mapLab.exportMap();m.spawn.id='spawn-metadata';m.instances.find(i=>i.id==='tree-front').x=3.1;await window.__mapLab.importMap(m);});
   await page.getByRole('button',{name:'配置・検査',exact:true}).click();await page.getByRole('button',{name:'出発点へ',exact:true}).click();
   await page.getByRole('button',{name:'閉じる',exact:true}).click();
   await page.reload();await page.waitForFunction(()=>window.__mapLab?.getState().ready);
   assert.equal(await page.evaluate(()=>window.__mapLab.exportMap().instances.find(i=>i.id==='tree-front').x),3.1);
   assert.equal(await page.evaluate(()=>window.__mapLab.getState().player.id),undefined);
   // Focus cancellation stops a held stick instead of leaving movement latched.
   const stick=await page.locator('#stick').boundingBox();
   await page.mouse.move(stick.x+stick.width/2,stick.y+stick.height/2);await page.mouse.down();
   await page.mouse.move(stick.x+stick.width-8,stick.y+stick.height/2);
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
   const before=await page.evaluate(()=>window.__mapLab.getState().player);await page.waitForTimeout(120);
   const after=await page.evaluate(()=>window.__mapLab.getState().player);assert.ok(Math.hypot(before.x-after.x,before.z-after.z)<.02);
   // Locomotion, action UI, all eight direction rows, and held-fall recovery.
   await page.getByRole('button',{name:'走行切替'}).click();
   assert.equal(await page.evaluate(()=>window.__mapLab.getState().running),true);
   await page.evaluate(()=>window.__mapLab.routeTo({x:7.8,z:12.5}));
   await page.waitForFunction(()=>window.__mapLab.getState().motion.id==='running');
   await page.waitForFunction(()=>window.__mapLab.getState().motion.frame>0);
   await page.evaluate(()=>window.__mapLab.stop());
   await page.getByRole('button',{name:'配置・検査',exact:true}).click();
   await page.locator('#motion-controls summary').click();
   await page.locator('#motion-select').selectOption('attack_katana');
   await page.locator('#motion-direction').selectOption('left');
   await page.getByRole('button',{name:'再生して閉じる'}).click();
   assert.equal(await page.locator('#drawer').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.__mapLab.getState().motion.facing),'left');
   await page.waitForFunction(()=>window.__mapLab.getState().motion.id==='standing');
   await page.evaluate(()=>{
    const lab=window.__mapLab,config=lab.getState().character;
    for(const [id,m]of Object.entries(config.motions))for(const direction of m.directions){
     lab.playMotion(id,direction);const state=lab.getState();
     if(state.motion.frame!==0||state.motion.facing!==direction||state.motion.rect[1]!==m.directions.indexOf(direction)*m.size[1])throw new Error('Incorrect motion or direction row');
    }
    lab.playMotion('fall','front');
   });
   await page.waitForFunction(()=>window.__mapLab.getState().motion.frame===7);
   const held=await page.evaluate(()=>window.__mapLab.getState().player);
   await page.screenshot({path:`test-results/${name}-${orientation}-fall.png`});
   await page.waitForTimeout(150);
   assert.deepEqual(await page.evaluate(()=>window.__mapLab.getState().player),held);
   await page.evaluate(()=>window.__mapLab.routeTo({x:7.8,z:12.5}));
   await page.waitForFunction(()=>window.__mapLab.getState().motion.id==='running');
   await page.evaluate(()=>window.__mapLab.stop());
   await page.getByRole('button',{name:'走行切替'}).click();
   await page.screenshot({path:`test-results/${name}-${orientation}-motions.png`});
   assert.equal((await page.request.get(new URL('old/README.md',base).href)).status(),404);
   assert.deepEqual(errors,[]);results.push({browser:name,orientation,pass:true});
  }catch(error){await page.screenshot({path:`test-results/${name}-${orientation}-failure.png`});throw error;}
  finally{await context.close();}
 }
 await browser.close();
}
fs.writeFileSync('test-results/browser-report.json',JSON.stringify({pass:true,results},null,2));console.log(JSON.stringify(results));
