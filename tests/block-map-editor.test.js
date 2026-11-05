import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadEditor() {
 const html=fs.readFileSync(new URL('../block-map-editor.html',import.meta.url),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 const items=new Map();
 function make(id='') {return {id,style:{},dataset:{},textContent:'',value:'',checked:false,children:[],classList:{toggle(){},add(){},remove(){}},append(...xs){this.children.push(...xs)},remove(){},click(){},addEventListener(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:650,height:600}}};}
 const el=id=>{if(!items.has(id))items.set(id,make(id));return items.get(id);};
 const ctx=new Proxy({},{get(o,k){return o[k]??(o[k]=()=>{})},set(o,k,v){o[k]=v;return true}});
 el('scene').getContext=()=>ctx;
 const document={getElementById:el,createElement:make,createTextNode:x=>x,querySelectorAll:s=>s==='#shapeList button'?el('shapeList').children:s==='#palette button'?el('palette').children:[],body:el('body')};
 const storage=new Map(),localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)};
 const window={devicePixelRatio:1};
 class ResizeObserver{constructor(cb){this.cb=cb}observe(){this.cb();}}
 vm.runInNewContext(script,{document,window,ResizeObserver,localStorage,console,Math,JSON,Map,Object,Set,Array,Date,Blob,URL,Number,Error,parseInt,confirm:()=>true,setTimeout(){},clearTimeout(){}},{timeout:6000});
 assert.ok(window.__voxelQA);
 return {qa:window.__voxelQA,el};
}
test('1マス1ブロック・積み上げ・Undo/Redo',()=>{
 const {qa}=loadEditor();
 assert.equal(qa.getState().blocks,0);
 qa.setCell(2,0,3,'place');qa.setCell(2,0,3,'place');
 assert.equal(qa.getState().blocks,1);
 qa.setCell(2,1,3,'place');assert.equal(qa.getState().blocks,2);
 qa.undo();assert.equal(qa.getState().blocks,1);
 qa.redo();assert.equal(qa.getState().blocks,2);
 qa.setCell(2,0,3,'erase');assert.equal(qa.getState().blocks,1);
});
test('8種類の形状と9種類の材質',()=>{
 const {qa,el}=loadEditor();
 assert.equal(qa.shapes.length,8);assert.equal(el('shapeList').children.length,8);assert.equal(el('palette').children.length,9);
});
test('不正な座標・重複ブロックを読込拒否',()=>{
 const {qa}=loadEditor();qa.setCell(1,0,2,'place');
 const d=qa.exportData();assert.equal(d.grid.cellSizeMetres,1);
 qa.validate(d);qa.loadDocument(d);assert.equal(qa.getState().blocks,1);
 const dupe=structuredClone(d);dupe.blocks.push(structuredClone(dupe.blocks[0]));assert.throws(()=>qa.validate(dupe));
 const out=structuredClone(d);out.blocks[0].x=12;assert.throws(()=>qa.validate(out));
});
test('地形・家・橋の見本がすべて同じ形式で保存できる',()=>{
 const {qa}=loadEditor();
 for(const kind of ['terrain','house','bridge']){qa.sample(kind);const d=qa.exportData();assert.ok(d.blocks.length>20,kind);qa.validate(d);}
});
test('立体表示の画面→セル変換を4方向・複数高さで検査',()=>{
 const {qa,el}=loadEditor();
 for(let k=0;k<4;k++){for(const y of [0,3,6]){qa.setLayer(y);
  for(const x of [0,3,6,11])for(const z of [0,3,6,11]){
   const p=qa.projection(x+.5,y,z+.5),b=qa.toCell(p.x,p.y);
   assert.equal(b.x,x);assert.equal(b.z,z);assert.equal(b.inside,true);
  }}el('viewRotate').onclick();}
});
