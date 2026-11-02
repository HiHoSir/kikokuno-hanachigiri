export function applyTransition(state,event,resolveArea){
 if(!event?.transition)return null;
 const target=resolveArea(event.transition.to);
 state.areaId=target.id;
 state.player={...(event.transition.spawn||target.spawn)};
 return target;
}
