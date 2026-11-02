import {validateMotions} from './motion.js?v=village-polish-3';
import {project,unproject,depthOrder,collidersFor,surfacesFor,groundTiles} from './logic.js?v=village-polish-3';
export async function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`画像を読み込めません: ${new URL(url).pathname}`));image.src=url;});}
export async function loadMapImages(map,url){
 const assets=new Map(),grounds=groundTiles(map),keys=[...grounds.map(a=>a.image),...Object.values(map.assets).map(a=>a.image)];
 await Promise.all([...new Set(keys)].map(async key=>assets.set(key,await loadImage(new URL(key,url)))));
 for(const a of [...grounds,...Object.values(map.assets)]){const image=assets.get(a.image);if(image.width!==a.size[0]||image.height!==a.size[1])throw new Error(`素材寸法が台帳と一致しません: ${a.image}`);}
 return assets;
}
export function validateCharacter(config){
 if(!Array.isArray(config.size)||config.size.length!==2||!config.size.every(x=>Number.isFinite(x)&&x>0)||!Array.isArray(config.anchor)||config.anchor.length!==2||!config.anchor.every(Number.isFinite)||!Number.isFinite(config.scale)||config.scale<=0||!Number.isFinite(config.radius)||config.radius<=0||!Number.isFinite(config.speed)||config.speed<=0)throw new Error('キャラクターの共通寸法・足元・速度が不正です');
 if(!config.animations?.idle?.default?.length)throw new Error('基準となる立ち姿がありません');
 if(config.anchor.some((v,i)=>v<0||v>config.size[i]))throw new Error('足元が共通セル範囲外です');
 for(const dirs of Object.values(config.animations)){
  if(!dirs||typeof dirs!=='object'||Array.isArray(dirs))throw new Error('方向別アニメーションが不正です');
  for(const frames of Object.values(dirs)){
   if(!Array.isArray(frames)||!frames.length)throw new Error('空のアニメーションは指定せず省略してください');
   for(const f of frames){
  if(!Array.isArray(f.rect)||f.rect.length!==4||!f.rect.every(Number.isFinite)||f.rect[2]!==config.size[0]||f.rect[3]!==config.size[1]||!Number.isFinite(f.durationMs)||f.durationMs<=0)throw new Error('コマごとに寸法を変えず共通セルで指定してください');
   if(typeof f.image!=='string'||!f.image.length)throw new Error('コマ画像がありません');
   }
  }
 }
 if(config.cameraReferenceHeight!==undefined&&(!Number.isFinite(config.cameraReferenceHeight)||config.cameraReferenceHeight<=0))throw new Error('カメラの基準表示高が不正です');
 validateMotions(config);
 return config;
}
export async function loadCharacter(url){
 const response=await fetch(url);if(!response.ok)throw new Error('キャラクター設定を取得できません');
 const config=validateCharacter(await response.json()),images=new Map();
 const assetUrl=key=>{const target=new URL(key,url),version=new URL(url).searchParams.get('v');if(version)target.searchParams.set('v',version);return target;};
 for(const dirs of Object.values(config.animations))for(const frames of Object.values(dirs))for(const f of frames){
  if(!images.has(f.image))images.set(f.image,await loadImage(assetUrl(f.image)));
  const im=images.get(f.image);if(f.rect[0]<0||f.rect[1]<0||f.rect[0]+f.rect[2]>im.width||f.rect[1]+f.rect[3]>im.height)throw new Error('アトラスのコマ範囲が不正です');
 }
 for(const m of Object.values(config.motions||{})){
  const im=await loadImage(assetUrl(m.image));
  if(im.width!==m.size[0]*m.frames||im.height!==m.size[1]*m.directions.length)throw new Error('モーション画像の寸法が台帳と一致しません');
  images.set(m.image,im);
 }
 return {config,images};
}
export class MapRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera={x:0,y:0,zoom:1};this.width=0;this.height=0;this.dpr=1;}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);if(r.width!==this.width||r.height!==this.height||dpr!==this.dpr){this.width=r.width;this.height=r.height;this.dpr=dpr;this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);}}
 updateCamera(map,player,hero,overview){
  this.resize();const start=project({x:map.bounds[0],z:map.bounds[1]},map.projection),end=project({x:map.bounds[2],z:map.bounds[3]},map.projection),gw=end.x-start.x,gh=end.y-start.y,p=project(player,map.projection);
  let zoom=overview?Math.min((this.width-24)/gw,(this.height-130)/gh):Math.min(110,this.height*.18)/(hero.cameraReferenceHeight??hero.size[1]*hero.scale);
  zoom=Math.max(.1,zoom);const vw=this.width/zoom,vh=this.height/zoom;
  const clamp=(v,min,max,span)=>span>=max-min?(min+max-span)/2:Math.max(min,Math.min(max-span,v));
  this.camera={x:overview?start.x+(gw-vw)/2:clamp(p.x-vw/2,start.x,end.x,vw),y:overview?start.y+(gh-vh)/2:clamp(p.y-vh*.57,start.y,end.y,vh),zoom};
 }
 toWorld(screen,map){return unproject({x:screen.x/this.camera.zoom+this.camera.x,y:screen.y/this.camera.zoom+this.camera.y},map.projection);}
 toScreen(world,map){const p=project(world,map.projection),c=this.camera;return {x:(p.x-c.x)*c.zoom,y:(p.y-c.y)*c.zoom};}
 draw(map,images,hero,player,{overview=false,debug=false,route=[],time=0,moving=false,facing='front_right',motion=null}={}){
  this.updateCamera(map,player,hero.config,overview);
  const c=this.ctx,cam=this.camera,k=this.dpr*cam.zoom;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#26382f';c.fillRect(0,0,this.width,this.height);
  c.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  for(const tile of groundTiles(map))c.drawImage(images.get(tile.image),...tile.offset);
  const drawAsset=i=>{const a=map.assets[i.asset],p=project(i,map.projection);c.imageSmoothingEnabled=true;c.drawImage(images.get(a.image),p.x-a.anchor[0]*a.scale,p.y-a.anchor[1]*a.scale,a.size[0]*a.scale,a.size[1]*a.scale);};
  for(const i of map.instances)if(map.assets[i.asset].layer==='ground')drawAsset(i);
  function shadow(x,y,rx,ry,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(41,45,26,${alpha})`);g.addColorStop(1,'rgba(41,45,26,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
  for(const i of map.instances){const a=map.assets[i.asset];if(a.shadow){const p=project(i,map.projection);shadow(p.x-10,p.y+4,a.shadow[0]*100,a.shadow[1]*100,.21);}}
  const foot=project(player,map.projection),shadowScale=hero.config.scale/1.295;shadow(foot.x,foot.y+3*shadowScale,22*shadowScale,6*shadowScale,.22);
  if(route.length){c.beginPath();c.moveTo(foot.x,foot.y);for(const q of route){const p=project(q,map.projection);c.lineTo(p.x,p.y);}c.strokeStyle='#fff3bc99';c.lineWidth=2/cam.zoom;c.setLineDash([4/cam.zoom,7/cam.zoom]);c.stroke();c.setLineDash([]);}
  for(const entity of depthOrder([...map.instances.filter(i=>map.assets[i.asset].layer!=='ground'),{...player,id:'~hero'}])){
   if(entity.id!=='~hero'){drawAsset(entity);continue;}
   const config=hero.config,frames=(moving&&config.animations.walk?.[facing])||config.animations.idle[facing]||config.animations.idle.default;
   const total=frames.reduce((sum,f)=>sum+f.durationMs,0);let t=time%total,frame=frames[0];for(const f of frames){if(t<f.durationMs){frame=f;break;}t-=f.durationMs;}
   if(motion)frame=motion;
   const anchor=frame.anchor||config.anchor;
   c.imageSmoothingEnabled=!config.pixelArt;c.drawImage(hero.images.get(frame.image),...frame.rect,foot.x-anchor[0]*config.scale,foot.y-anchor[1]*config.scale,frame.rect[2]*config.scale,frame.rect[3]*config.scale);
  }
  if(debug){
   const polygon=(points,fill,stroke)=>{c.beginPath();for(const [j,v]of points.entries()){const p=project({x:v[0],z:v[1]},map.projection);j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=1/cam.zoom;c.stroke();};
   for(const s of surfacesFor(map))polygon(s.polygon,'#4ec98c14','#99e7b8a6');
   for(const o of collidersFor(map))polygon(o.polygon,'#e65c775c','#ffbfd0');
   c.font=`${12/cam.zoom}px sans-serif`;c.textAlign='center';for(const i of map.instances){const p=project(i,map.projection);c.beginPath();c.arc(p.x,p.y,4/cam.zoom,0,Math.PI*2);c.fillStyle='#fff6c7';c.fill();c.fillText(i.id,p.x,p.y-8/cam.zoom);}
   c.save();c.translate(foot.x,foot.y);c.scale(1,Math.sin(map.projection.elevation*Math.PI/180));c.beginPath();c.arc(0,0,configRadius(hero)*map.projection.pixelsPerMetre,0,Math.PI*2);c.strokeStyle='#ffed83';c.stroke();c.restore();
  }
 }
}
const configRadius=hero=>hero.config.radius;
