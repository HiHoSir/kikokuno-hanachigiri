// Motion-demo timing and weight transfer, adapted to 8-direction field-lab artwork.
// No image scaling, replacement sprites, or change to feet anchor.
export const DURATION={surprise:1.8,wave:2.8,bow:2.4,cheer:2.4,talk:1.6};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function motionPose({mode='idle',elapsed=0,clock=0,phase=0,moving=false}){
 const duration=DURATION[mode]||1;
 const t=clamp(elapsed/duration);
 const ease=mode==='idle'||mode==='walk'?0:Math.min(1,t/.12,(1-t)/.2);
 // Motion-demo: translation is keyed to elapsed time; planted shadow never moves.
 const contact=Math.cos(phase*2);
 const bob=moving?(1-contact)*.00325:Math.sin(clock*2)*.00175;
 const sway=moving?Math.sin(phase)*.008:Math.sin(clock*1.4)*.003;
 let jump=0,angle=sway,x=0,y=bob;
 if(!moving){
  if(mode==='surprise'){jump=Math.sin(Math.min(t/.46,1)*Math.PI)*.028*ease;angle=-.035*ease}
  if(mode==='wave'){angle+=.018*Math.sin(elapsed*5)*ease;x=.006*Math.sin(elapsed*3)*ease}
  if(mode==='bow'){angle+=.015*Math.sin(Math.PI*t)*ease;y-=.007*Math.sin(Math.PI*t)*ease}
  if(mode==='cheer'){jump=Math.abs(Math.sin(t*Math.PI*3))*.017*ease;angle+=.015*Math.sin(elapsed*9)*ease}
  if(mode==='talk'){angle+=.018*Math.sin(elapsed*4)*ease}
 }
 return {x,y:y-jump,angle,shadowOpacity:Math.max(.16,.34-jump*2),actionStrength:ease};
}
