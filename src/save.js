export const SAVE_KEY='kikoku-game-state-v1';
export function encodeSave(state){return JSON.stringify({version:1,areaId:state.areaId,player:state.player,flags:state.flags,hp:state.hp,maxHp:state.maxHp,inventory:state.inventory});}
export function decodeSave(raw,resolveArea){
 try{
  const data=JSON.parse(raw);
  if(data?.version!==1||typeof data.areaId!=='string'||!data.flags||typeof data.flags!=='object'||Array.isArray(data.flags))return null;
  const area=resolveArea(data.areaId),x=data.player?.x,z=data.player?.z;
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>19||Math.abs(z)>19)return null;
  return {areaId:area.id,player:{x,z},flags:{...data.flags},hp:Number.isFinite(data.hp)?data.hp:75,maxHp:Number.isFinite(data.maxHp)?data.maxHp:100,inventory:data.inventory&&typeof data.inventory==='object'&&!Array.isArray(data.inventory)?{...data.inventory}:{}};
 }catch{return null;}
}
