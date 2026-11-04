import asyncio, json, subprocess, time
from pathlib import Path
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

P=Path(__file__).resolve().parent.parent

def art_checks():
    names=('sakura_canopy_back','sakura_trunk','sakura_canopy_mid','sakura_canopy_front')
    m=json.loads((P/'assets/render-metadata.json').read_text())
    metas=[m['assets'][n] for n in names]
    assert all(x['size']==[520,495] and x['anchor']==[260,455] for x in metas)
    assert (P/'assets/sakura_trunk.glb').exists()
    assert all(Image.open(P/'assets'/f'{n}.png').getbbox() for n in names)
    stack=Image.new('RGBA',(520,495))
    for n in names:stack.alpha_composite(Image.open(P/'assets'/f'{n}.png').convert('RGBA'))
    assert ImageChops.difference(stack,Image.open(P/'assets/sakura_hybrid.png')).getbbox() is None
    # World anchors unchanged; no collision patch in game template.
    html=(P/'source/demo_template.html').read_text()
    assert 'Math.hypot(x-e.x,z-e.z)<.26' in html
    assert 'const projection=p=>' in html
    print('art / anchors / trunk collision: PASS')

async def browser():
  server=subprocess.Popen(['python','-m','http.server','18765','--bind','127.0.0.1','--directory',str(P)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  await asyncio.sleep(.8)
  try:
   await _browser_inner()
  finally:
   server.terminate();server.wait(timeout=10)

async def _browser_inner():
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for label,width,height in (('desktop',1100,760),('iphone',390,844)):
      page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      await page.set_content((P/'hanachigiri_3d2d_sakura_layers_v8.html').read_text(encoding='utf-8'),wait_until='domcontentloaded')
      await page.wait_for_function('window.__demoQA?.get().ready===true',timeout=45000)
      state=await page.evaluate('window.__demoQA.get()')
      assert state['ready'] and state['texturesEnabled'] and state['layerMode']==0
      assert await page.evaluate('window.__demoQA.canStand(10.9,7.2)')==False
      assert await page.evaluate('window.__demoQA.canStand(13.2,6.1)')==False
      assert await page.evaluate('window.__demoQA.canStand(13.35,9.7)')==True
      assert await page.evaluate('window.__demoQA.go(12.9,9.75)')>0
      await page.evaluate('window.__demoQA.set(9,9)')
      await page.screenshot(path=str(P/f'preview-v8-{label}.png'))
      await page.locator('#texture').click()
      assert await page.evaluate('window.__demoQA.get().texturesEnabled') == False
      await page.screenshot(path=str(P/f'preview-v7-{label}.png'))
      await page.locator('#texture').click()
      for j in range(1,5):
        await page.locator('#layers').click()
        assert await page.evaluate('window.__demoQA.get().layerMode')==j
      await page.locator('#layers').click()
      assert await page.evaluate('window.__demoQA.get().layerMode')==0
      await page.locator('#debug').click()
      assert await page.evaluate('window.__demoQA.get().debug')
      assert not errors,errors
      print(label,'PASS',{'route_length':state['routeLength'],'heroAvailable':state['heroAvailable']},'screenshot')
      await page.close()
    await browser.close()

if __name__=='__main__':
 art_checks()
 asyncio.run(browser())