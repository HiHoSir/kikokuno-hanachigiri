/* AI pixel patch bridge for the cloned Yaksha 32px editor.
   The page never calls an AI service. ChatGPT receives a copied pixel grid
   and returns a validated per-pixel proposal; nothing is changed until approval. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const api=window.YakshaPixelBridge;
if(!api){$('aiStatus').textContent='エディタ連携を初期化できませんでした。';return;}
const WIDTH=32, HEIGHT=32;
let proposal=null;
const poseNames={idle:'静止',walkA:'歩行A',walkB:'歩行B'};
function status(msg){$('aiStatus').textContent=msg;}
function hash(data){let h=2166136261;for(let i=0;i<data.length;i++){h^=data[i];h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function drawArray(canvas,arr){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.putImageData(new ImageData(arr,WIDTH,HEIGHT),0,0);}
function codeColor(rgba){return '#'+rgba.map(v=>v.toString(16).padStart(2,'0')).join('');}
function encodeGrid(rgba){
 const indices=new Map(),palette=['transparent'],grid=[];
 for(let y=0;y<HEIGHT;y++){
  let row='';
  for(let x=0;x<WIDTH;x++){
   const p=(y*WIDTH+x)*4, a=rgba[p+3];
   let color=a===0?'transparent':codeColor([rgba[p],rgba[p+1],rgba[p+2],a]);
   if(!indices.has(color)){
    const next=palette.length;
    if(next>=1296)throw Error('色数が多すぎます');
    indices.set(color,next);palette.push(color);
   }
   row+=indices.get(color).toString(36).padStart(2,'0');
  }
  grid.push(row);
 }
 return {palette,grid};
}
function generatePrompt(){
 const frame=api.info(),encoded=encodeGrid(api.current());
 const palette=encoded.palette.map((c,i)=>i.toString(36).padStart(2,'0')+'='+c).join(' ');
 const request=$('aiInstruction').value.trim()||'元の絵を保ち、途切れた輪郭を必要最小限のドットで整えてください';
 return [
 'あなたは64枚の画像を再生成するAIではなく、32×32ドット絵を座標ごとに修正する職人です。',
 '下記の現在の画像に対して、私の指示だけを最小限の画素変更で実行してください。',
 '対象は緋月の既存スプライト。髪色、角、赤白紺の衣装、元ポーズを守ること。',
 '変更指示: '+request,
 '対象フレーム direction='+frame.direction+' pose='+frame.pose,
 '座標: 左上=(0,0)、右下=(31,31)。',
 '色表 (各グリッド記号は2文字の36進数): '+palette,
 '32行のグリッド（1行64文字）:',
 ...encoded.grid,
 '回答は説明なしで次のJSON形式のオブジェクト1個だけ。変更するピクセルのみ列挙。変更しないピクセルは一切含めない。',
 '{"format":"yaksha-pixel-patch-v1","direction":"'+frame.direction+'","pose":"'+frame.pose+'","pixels":[{"x":10,"y":12,"rgba":[0,0,0,255]}]}',
 'rgbaは各0..255の整数。完全透明は[0,0,0,0]。最大256画素。デザイン変更や画面全体の塗り替えは禁止。',
 '画素の変更が不要ならpixelsを空配列にしてください。'
 ].join('\n');
}
function parsePatch(value){
 const clean=value.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
 const j=JSON.parse(clean),now=api.info();
 if(j.format!=='yaksha-pixel-patch-v1')throw Error('formatはyaksha-pixel-patch-v1にしてください');
 if(j.direction!==now.direction||j.pose!==now.pose)throw Error('現在の方向・ポーズと一致しません（'+now.direction+'/'+now.pose+'）');
 if(!Array.isArray(j.pixels)||j.pixels.length>1024)throw Error('pixelsは0〜1024件の配列にしてください');
 const updates=new Map();
 for(const p of j.pixels){
  if(!Number.isInteger(p.x)||p.x<0||p.x>=WIDTH||!Number.isInteger(p.y)||p.y<0||p.y>=HEIGHT)throw Error('不正な座標です');
  let rgba=p.rgba;
  if(typeof p.color==='string' && /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(p.color)){
   const c=p.color.slice(1);rgba=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16));rgba.push(c.length===8?parseInt(c.slice(6,8),16):255);
  }
  if(!Array.isArray(rgba)||rgba.length!==4||!rgba.every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('RGBA値は0〜255の整数4個です');
  updates.set(p.y*WIDTH+p.x,{x:p.x,y:p.y,rgba:rgba.slice()});
 }
 return [...updates.values()];
}
function compareAndShow(){
 proposal=null;
 try{
  const before=api.current(), now=api.info(), changes=parsePatch($('aiPatch').value);
  const after=before.slice();let changed=0;
  for(const p of changes){const at=(p.y*WIDTH+p.x)*4;let different=false;for(let c=0;c<4;c++)if(after[at+c]!==p.rgba[c])different=true;if(different){after.set(p.rgba,at);changed++;}}
  drawArray($('aiBefore'),before);drawArray($('aiAfter'),after);
  proposal={changes,hash:hash(before),direction:now.direction,pose:now.pose,count:changed};
  $('aiApply').disabled=changed===0;
  status(changed+'画素の変更候補を確認しました。元画像は未変更です。'+(changed>256?' 大きな編集なので適用時に確認します。':''));
 }catch(e){$('aiApply').disabled=true;status('パッチ検証エラー: '+e.message);}
}
$('aiLoadHizuki').addEventListener('click',async()=>{
 try{if(!confirm('現在の12コマを既存の緋月画像で置き換えますか？'))return;await api.loadApproved();proposal=null;$('aiApply').disabled=true;drawArray($('aiBefore'),api.current());drawArray($('aiAfter'),api.current());status('参照用緋月32pxを読み込みました。方向とポーズを切り替えて編集できます。');}
 catch(e){status('読み込みエラー: '+e.message);}
});
$('aiCopy').addEventListener('click',async()=>{
 try{
  const value=generatePrompt();$('aiPromptOutput').value=value;
  $('aiPromptOutput').hidden=false;
  try{await navigator.clipboard.writeText(value);status('AIへの指示文をコピーしました。ChatGPTに貼り付けてください。');}
  catch(e){$('aiPromptOutput').focus();$('aiPromptOutput').select();status('指示文を用意しました。選択してコピーし、ChatGPTに貼り付けてください。');}
 }catch(e){status('指示文の作成に失敗: '+e.message);}
});
$('aiPreview').addEventListener('click',compareAndShow);
$('aiApply').addEventListener('click',()=>{
 if(!proposal)return status('最初に差分をプレビューしてください。');
 const now=api.info();
 if(now.direction!==proposal.direction||now.pose!==proposal.pose||hash(api.current())!==proposal.hash){
  proposal=null;$('aiApply').disabled=true;
  return status('編集中の画像が変わりました。差分を再検証してください。');
 }
 if(proposal.count>256&&!confirm(proposal.count+'画素を変更します。続行しますか？'))return;
 const n=api.apply(proposal.changes);
 proposal=null;$('aiApply').disabled=true;
 status(n+'画素を適用しました。元に戻す場合は既存のUndoボタンを使えます。');
 drawArray($('aiBefore'),api.current());drawArray($('aiAfter'),api.current());
});
$('aiPatch').addEventListener('input',()=>{proposal=null;$('aiApply').disabled=true;});
drawArray($('aiBefore'),api.current());
drawArray($('aiAfter'),api.current());
status('32×32の既存フレームをAIに渡し、修正案を安全に適用できます。');
})();