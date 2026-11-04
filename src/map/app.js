import {MotionPlayer} from './motion.js?v=idle-v21';
import {validateMap,canStand,move,findPath,followRoute} from './logic.js?v=scene-alignment-6';
import {MapRenderer,loadMapImages,loadCharacter} from './renderer.js?v=idle-v21';
import {createInput} from './input.js?v=scene-alignment-6';

const canvas=document.querySelector('#scene'),renderer=new MapRenderer(canvas),MAP_URL=new URL('../../maps/village/map.json?v=scene-alignment-6',import.meta.url);
const storageKey='hanachigiri.layered.village.v1',positionKey=storageKey+'.feet';
let motions,running=false;
let map,original,images,hero,player,route=[],overview=false,debug=false,moving=false,facing='front_right',last=performance.now(),elapsed=0,toastTimer,saveTimer=0,ready=false;
const $=id=>document.getElementById(id);
function tell(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4300);}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{tell('端末への保存ができません。JSONの保存をご利用ください。');}}
function restore(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function goTo(target){if(!ready)return false;motions?.cancel();route=findPath(map,player,target,hero.config.radius);if(!route.length){tell('その場所へは歩いて行けません。道や橋を選んでください。');return false;}return true;}
function inspectNearby(){if(!ready)return;const point=(map.landmarks||[]).filter(p=>Math.hypot(player.x-p.x,player.z-p.z)<p.radius).sort((a,b)=>Math.hypot(player.x-a.x,player.z-a.z)-Math.hypot(player.x-b.x,player.z-b.z))[0];tell(point?.message||'家の入口や北の広場、村の端の近くで調べられます。');}
const input=createInput(canvas,p=>{const r=canvas.getBoundingClientRect();goTo(renderer.toWorld({x:p.x-r.left,y:p.y-r.top},map));},inspectNearby);
function refreshObjects(){
 const select=$('object-select'),current=select.value;select.replaceChildren();
 for(const i of map.instances){const option=document.createElement('option');option.value=i.id;option.textContent=i.id;select.append(option);}
 if(map.instances.some(i=>i.id===current))select.value=current;refreshCoordinates();
}
function refreshCoordinates(){const i=map.instances.find(i=>i.id===$('object-select').value);if(!i)return;$('object-x').value=i.x.toFixed(2);$('object-z').value=i.z.toFixed(2);}
async function installMap(candidate,{persist=true,reload=false}={}){
 validateMap(candidate);const nextImages=reload?await loadMapImages(candidate,MAP_URL):images;
 map=candidate;images=nextImages;route=[];input.clear();if(!player||!canStand(map,player.x,player.z,hero.config.radius))player={x:map.spawn.x,z:map.spawn.z};
 $('map-title').textContent=map.title||'村のマップ';refreshObjects();if(persist)save(storageKey,map);
}
$('object-select').addEventListener('change',refreshCoordinates);
$('apply-position').addEventListener('click',async()=>{try{const next=structuredClone(map),i=next.instances.find(i=>i.id===$('object-select').value);i.x=Number($('object-x').value);i.z=Number($('object-z').value);await installMap(next);tell('配置と判定を更新しました。');}catch(error){tell(error.message);}});
$('overview').addEventListener('click',()=>{overview=!overview;$('overview').textContent=overview?'追従に戻る':'全景';});
function drawer(open){$('drawer').hidden=!open;$('inspect').setAttribute('aria-expanded',String(open));input.clear();route=[];}
$('inspect').addEventListener('click',()=>drawer($('drawer').hidden));$('close-drawer').addEventListener('click',()=>drawer(false));
$('debug').addEventListener('change',e=>debug=e.target.checked);
$('reset-player').addEventListener('click',()=>{player={x:map.spawn.x,z:map.spawn.z};motions?.cancel();route=[];input.clear();tell('出発点に戻りました。');});
$('reset-map').addEventListener('click',async()=>{try{await installMap(structuredClone(original),{reload:true});player={x:map.spawn.x,z:map.spawn.z};tell('初期配置に戻しました。');}catch(e){tell(e.message);}});
$('export-map').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(map,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${map.id}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);tell('マップJSONを保存しました。');
});
$('import-map').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1_000_000)throw new Error('JSONが大きすぎます。');await installMap(JSON.parse(await file.text()),{reload:true});tell('マップJSONを読み込みました。');}catch(error){tell(`読込できません: ${error.message}`);}finally{e.target.value='';}});
$('run').addEventListener('click',()=>{running=!running;$('run').setAttribute('aria-pressed',String(running));$('run').textContent=running?'走行中':'歩行中';});
function playMotion(id,direction){if(!ready)return;motions.play(id,direction);facing=direction;route=[];input.clear();drawer(false);}
$('play-motion').addEventListener('click',()=>playMotion($('motion-select').value,$('motion-direction').value));
$('stop-motion').addEventListener('click',()=>{motions?.cancel();route=[];input.clear();drawer(false);});
$('motion-pad-toggle').addEventListener('click',()=>{const open=$('motion-buttons').hidden;$('motion-buttons').hidden=!open;$('motion-pad-toggle').setAttribute('aria-expanded',String(open));});
$('quick-stop-motion').addEventListener('click',()=>{motions?.cancel();route=[];input.clear();});
$('retry').addEventListener('click',()=>location.reload());
function face(dx,dz){const horizontal=Math.abs(dx)>.3,vertical=Math.abs(dz)>.3;if(horizontal&&vertical)return `${dz>0?'front':'back'}_${dx>0?'right':'left'}`;return horizontal?(dx>0?'right':'left'):(dz>0?'front':'back');}
function update(dt,direction){
 let {x,y}=direction;moving=false;
 if(motions?.busy){if(Math.hypot(x,y)>.05)motions.cancel();else return;}
 if(Math.hypot(x,y)>.05)route=[];
 else if(route.length){
  const step=followRoute(map,player,route,dt,running?hero.config.runSpeed:hero.config.speed,hero.config.radius);
  player=step.player;route=step.route;moving=step.moving;if(moving)facing=face(step.dx,step.dz);return;
 }
 if(Math.hypot(x,y)>.05){
  // Undo ground foreshortening for screen-direction input; route vectors already
  // use world metres, so only manual input is converted here.
  if(direction.x||direction.y)y/=Math.sin(map.projection.elevation*Math.PI/180);
  const speed=running?hero.config.runSpeed:hero.config.speed;
  const next=move(map,player,x,y,dt,speed,hero.config.radius);
  moving=Math.hypot(next.x-player.x,next.z-player.z)>.00001;facing=face(x,y);player=next;if(!moving&&route.length)route=[];
 }
}
function loop(now){
 const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 if(ready){
  const active=!document.hidden&&$('drawer').hidden;
  if(active){const before={...player};update(dt,input.direction());elapsed+=dt*1000;motions.update(dt*1000,{moving,running,facing,distance:Math.hypot(player.x-before.x,player.z-before.z)});}else moving=false;
  renderer.draw(map,images,hero,player,{overview,debug,route,time:elapsed,moving,facing,motion:motions.current});
  saveTimer+=dt;if(saveTimer>1){saveTimer=0;save(positionKey,{id:map.id,revision:map.revision,...player});}
 }
 requestAnimationFrame(loop);
}
async function boot(){
 try{
  const response=await fetch(MAP_URL);if(!response.ok)throw new Error('マップを取得できません');original=validateMap(await response.json());
  hero=await loadCharacter(new URL('../../assets/characters/hizuki-v35/character.json?v=katana-v44-orientation-scale-fix1',import.meta.url));
  motions=new MotionPlayer(hero.config);
  for(const [id,m]of Object.entries(hero.config.motions)){const option=document.createElement('option');option.value=id;option.textContent=m.label;$('motion-select').append(option);}
  for(const [id,m]of Object.entries(hero.config.motions)){
   const button=document.createElement('button');button.type='button';button.dataset.motion=id;button.textContent=m.label;button.addEventListener('click',()=>playMotion(id,facing));$('motion-buttons').append(button);
  }
  let restored=restore(storageKey);try{validateMap(restored);}catch{restored=null;}
  if(restored?.id!==original.id||restored?.revision!==original.revision)restored=null;
  map=restored||structuredClone(original);
  try{images=await loadMapImages(map,MAP_URL);}catch(error){
   if(!restored)throw error;
   map=structuredClone(original);images=await loadMapImages(map,MAP_URL);save(storageKey,map);
   tell('保存した配置の画像を読めなかったため、初期配置に戻しました。');
  }
  player={x:map.spawn.x,z:map.spawn.z};
  const stored=restore(positionKey);if(stored?.id===map.id&&stored?.revision===map.revision&&canStand(map,stored.x,stored.z,hero.config.radius))player={x:stored.x,z:stored.z};
  $('map-title').textContent=map.title;refreshObjects();ready=true;$('loading').hidden=true;
  setTimeout(()=>$('hint').style.opacity='0',8500);
 }catch(error){$('loading').querySelector('p').textContent=error.message;$('loading').querySelector('.spinner').hidden=true;$('retry').hidden=false;console.error(error);}
}
window.__mapLab={
 getState:()=>({ready,player:{...player},route:structuredClone(route),map:structuredClone(map),camera:{...renderer.camera},moving,facing,running,motion:motions?.current,overview,character:hero?{...hero.config}:null}),
 playMotion,
 toScreen:p=>renderer.toScreen(p,map),routeTo:goTo,
 setPosition:p=>{if(!canStand(map,p.x,p.z,hero.config.radius))throw new Error('歩行範囲外');player={x:p.x,z:p.z};route=[];},
 step:(dx,dz,dt=.05)=>update(dt,{x:dx,y:dz}),
 importMap:async data=>installMap(structuredClone(data),{reload:true}),
 stop:()=>{route=[];input.clear();motions?.cancel();},
 exportMap:()=>JSON.parse(JSON.stringify(map)),
};
window.addEventListener('blur',()=>{input.clear();route=[];});document.addEventListener('visibilitychange',()=>{input.clear();route=[];last=performance.now();});
requestAnimationFrame(loop);boot();
