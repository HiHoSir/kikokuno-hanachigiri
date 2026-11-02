import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root,'experiments/ai-pixel-editor/index.html'),'utf8');
const source = fs.readFileSync(path.join(root,'experiments/ai-pixel-editor/ai-pixel-bridge.js'),'utf8');

test('cloned editor preserves 32px editing core and has one each AI control', () => {
  assert.match(html, /const N=32,S=16/);
  assert.match(html, /setupTouchWorkspace\(\)/);
  assert.match(html, /src="\.\/ai-pixel-bridge\.js"/);
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline);
  new Function(inline);
  new Function(source);
  for(const id of ['aiLoadHizuki','aiCopy','aiPreview','aiApply','aiBefore','aiAfter','aiPatch','aiStatus']){
    assert.equal((html.match(new RegExp('id="' + id + '"','g'))||[]).length,1,'duplicated/missing '+id);
  }
});

function boot(){
  const elems = Object.create(null);
  for(const id of ['aiStatus','aiLoadHizuki','aiCopy','aiPreview','aiApply','aiPatch','aiBefore','aiAfter','aiPromptOutput','aiInstruction']){
    elems[id] = {
      value: '', textContent: '', hidden: true, disabled: id === 'aiApply',
      listeners: {},
      addEventListener(event,handler){this.listeners[event]=handler;},
      getContext(){return {clearRect(){},putImageData(){}};},
      focus(){}, select(){}
    };
  }
  const pixels = new Uint8ClampedArray(32*32*4);
  let applied = 0, direction = 'front', pose = 'idle';
  let pending = null;
  const api = {
    info(){return {direction,pose};},
    current(){return pixels.slice();},
    apply(changes){
      for(const p of changes)pixels.set(p.rgba,4*(p.y*32+p.x));
      applied++;
      return changes.length;
    },
    loadApproved(){return Promise.resolve();}
  };
  const context = {
    document:{getElementById(id){return elems[id];}},
    window:{YakshaPixelBridge:api},
    ImageData:class{constructor(data){this.data=data;}},
    navigator:{clipboard:{async writeText(s){pending=s;}}},
    confirm(){return true;}
  };
  vm.runInNewContext(source, context);
  const click=(id)=>elems[id].listeners.click();
  const patch=(data)=>{elems.aiPatch.value=JSON.stringify(data);elems.aiPatch.listeners.input();};
  return {elems,pixels,click,patch,api,applied:()=>applied,prompt:()=>pending,setDirection:d=>direction=d};
}
const valid = (pixels) => ({format:'yaksha-pixel-patch-v1',direction:'front',pose:'idle',pixels});

test('preview leaves original untouched, apply changes only proposed pixels', () => {
  const t=boot();
  const p=[{x:1,y:2,rgba:[30,40,50,255]}];
  t.patch(valid(p));t.click('aiPreview');
  assert.equal(t.elems.aiApply.disabled,false);
  assert.equal(t.pixels[(2*32+1)*4],0,'preview mutated source');
  t.click('aiApply');
  assert.equal(t.pixels[(2*32+1)*4],30);
  assert.equal(t.applied(),1);
  assert.equal(t.elems.aiApply.disabled,true);
});

test('wrong direction, invalid coordinate and invalid RGBA are rejected',()=>{
 const t=boot();
 for(const bad of [
   {...valid([{x:0,y:0,rgba:[1,2,3,255]}]),direction:'back'},
   valid([{x:32,y:0,rgba:[1,2,3,255]}]),
   valid([{x:1,y:0,rgba:[1,2,-3,255]}]),
   {...valid([]),format:'wrong'}
 ]){
  t.patch(bad);t.click('aiPreview');
  assert.equal(t.elems.aiApply.disabled,true);
  assert.match(t.elems.aiStatus.textContent,/エラー/);
 }
 assert.equal(t.applied(),0);
});

test('edits made after preview invalidate proposal',()=>{
 const t=boot(); t.patch(valid([{x:0,y:0,rgba:[1,2,3,255]}]));
 t.click('aiPreview');t.pixels[4]=99;t.click('aiApply');
 assert.equal(t.applied(),0);
 assert.match(t.elems.aiStatus.textContent,/変わりました/);
});

test('hex color patches and duplicate coordinates are handled',()=>{
 const t=boot();
 t.patch(valid([{x:3,y:5,color:'#aa8833'},{x:3,y:5,color:'#bdcdef'}]));
 t.click('aiPreview');t.click('aiApply');
 const i=4*(5*32+3);
 assert.deepEqual(Array.from(t.pixels.slice(i,i+4)),[189,205,239,255]);
});
