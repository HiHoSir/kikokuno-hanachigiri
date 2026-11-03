"""Smoke+semantic QA of actual oblique rasterized demo in headless Chromium."""
from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent.parent
URL=(P/'hanachigiri_3d2d_demo.html').resolve().as_uri()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,label in [(980,740,'desktop'),(390,844,'iphone')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  page.route('https://hihosir.github.io/**',lambda r:r.abort())
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto('about:blank')
  page.set_content((P/'hanachigiri_3d2d_demo.html').read_text(),wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('window.__demoQA && window.__demoQA.get().ready',timeout=12000)
  page.wait_for_timeout(300)
  state=page.evaluate('__demoQA.get()')
  assert state['azimuth']==35 and state['projection']=='orthographic'
  for x,z in [(1.5,1.7),(3.3,7.4),(9,9),(11.4,12.1),(13.4,9.5)]:
   v=page.evaluate('([x,z])=>{const p=__demoQA.project({x,z});return __demoQA.inverse(p)}',[x,z])
   assert abs(v['x']-x)<1e-8 and abs(v['z']-z)<1e-8,(x,z,v)
  assert page.evaluate('__demoQA.canStand(4.35,7)') is False
  assert page.evaluate('__demoQA.canStand(6.95,3.65)') is False
  assert page.evaluate('__demoQA.canStand(10.9,7.2)') is False
  assert page.evaluate('__demoQA.canStand(13.3,6)') is False
  assert page.evaluate('__demoQA.canStand(13.35,9.7)') is True
  assert page.evaluate('__demoQA.go(13.75,9.7)')>0
  assert page.evaluate('__demoQA.go(6.95,5.6)')>0
  page.evaluate('__demoQA.set(9,9)')
  page.locator('#reset').click()
  page.screenshot(path=str(P/f'preview-{label}.png'))
  page.locator('#debug').click()
  page.screenshot(path=str(P/f'debug-{label}.png'))
  assert not errors,errors
  print(label, 'PASS',state, 'route, collision, inverse projection, UI, no JS errors')
  page.close()
 browser.close()
for name in ['ground','house','teahouse','tree','sakura','bridge','rock','lantern','shrub','fence','flowerpatch']:
 im=Image.open(P/'assets'/f'{name}.png')
 assert im.mode=='RGBA'
 if name=='ground':assert im.size==(2440,1810)
 else:assert im.width>30 and im.height>30
print('PASS eleven independent RGBA source images')