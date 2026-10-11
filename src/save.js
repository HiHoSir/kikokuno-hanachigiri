export const SAVE_KEY='kikoku-game-state-v1';
// Preserve the original v1 object shape when the caller has no new fields.
// Hozuki saves may additionally carry HP and inventory without altering legacy saves.
export function encodeSave(state){
 const data={version:1,areaId:state.areaId,player:state.player,flags:state.flags};
 if(Number.isFinite(state.hp))data.hp=state.hp;
 if(Number.isFinite(state.maxHp))data.maxHp=state.maxHp;
 if(state.inventory&&typeof state.inventory==='object'&&!Array.isArray(state.inventory))data.inventory=state.inventory;
 return JSON.stringify(data);
}
export function decodeSave(raw,resolveArea){
 try{
  const data=JSON.parse(raw);
  if(data?.version!==1||typeof data.areaId!=='string'||!data.flags||typeof data.flags!=='object'||Array.isArray(data.flags))return null;
  const area=resolveArea(data.areaId),x=data.player?.x,z=data.player?.z;
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>19||Math.abs(z)>19)return null;
  const result={areaId:area.id,player:{x,z},flags:{...data.flags}};
  if(Number.isFinite(data.hp))result.hp=data.hp;
  if(Number.isFinite(data.maxHp))result.maxHp=data.maxHp;
  if(data.inventory&&typeof data.inventory==='object'&&!Array.isArray(data.inventory))result.inventory={...data.inventory};
  return result;
 }catch{return null;}
}
