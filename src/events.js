// Minimal engine-agnostic interaction selector. Persistent flags live in game state.
export function createGameState(area) {
 return {areaId:area.id,flags:{},player:{...area.spawn}};
}
export function getNearestInteraction(area,position,state){
 let nearest=null, distance=Infinity;
 for(const event of area.interactions||[]){
  if(event.trigger!=='action'||(event.once&&state.flags[event.id]))continue;
  const d=Math.hypot(position.x-event.x,position.z-event.z);
  if(d<=event.range&&d<distance){nearest=event;distance=d}
 }
 return nearest;
}
export function interact(area,state){
 const found=getNearestInteraction(area,state.player,state);
 if(!found)return {id:null,text:area.defaultAction||'',changed:false};
 if(found.once)state.flags[found.id]=true;
 return {id:found.id,text:found.text,changed:!!found.once};
}
