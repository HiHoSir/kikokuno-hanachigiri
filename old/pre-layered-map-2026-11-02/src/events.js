// Engine-independent interaction rules and persistent inventory.
export function createGameState(area){return {areaId:area.id,flags:{},player:{...area.spawn},hp:75,maxHp:100,inventory:{}};}
export function getNearestInteraction(area,position,state){
 let nearest=null,distance=Infinity;
 for(const event of area.interactions||[]){
  if(event.trigger!=='action'||(event.once&&state.flags[area.id+':'+event.id]))continue;
  const d=Math.hypot(position.x-event.x,position.z-event.z);
  if(d<=event.range&&d<distance){nearest=event;distance=d;}
 }
 return nearest;
}
export function interact(area,state){
 const found=getNearestInteraction(area,state.player,state);
 if(!found)return {id:null,text:area.defaultAction||'',changed:false};
 const key=area.id+':'+found.id;
 const already=!!(found.flag&&state.flags[found.flag]);
 if(found.once)state.flags[key]=true;
 if(found.flag)state.flags[found.flag]=true;
 let text=already&&found.afterText?found.afterText:found.text;
 if(found.kind==='pot'){
  if(state.flags['looted:'+key])return {id:found.id,text:'壺は空っぽだった。',changed:false};
  state.flags['looted:'+key]=true;
  state.inventory??={};state.inventory['薬草']=(state.inventory['薬草']||0)+1;
  text+='\n薬草 ×1 を手に入れた。';
 }
 if(found.kind==='well'){
  const previous=state.hp??75;state.maxHp??=100;
  state.hp=state.maxHp;
  text+='\nHP '+previous+' → '+state.hp;
 }
 if(found.kind==='vegetable'){
  const key2='harvest:'+key;
  if(state.flags[key2])return {id:found.id,text:'収穫したばかりなので、まだ実っていない。',changed:false};
  state.flags[key2]=true;
  state.inventory??={};state.inventory['鬼灯の里の野菜']=(state.inventory['鬼灯の里の野菜']||0)+1;
  text+='\n鬼灯の里の野菜 ×1 を手に入れた。';
 }
 return {id:found.id,text,changed:!!found.kind||!!found.once||!!found.flag&&!already,transition:found.transition||null};
}
