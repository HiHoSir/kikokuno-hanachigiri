// Source-pixel landmarks. They animate artwork; they never resize a head or body.
// Side views contain one visible leg: no invented hidden-leg pixels are added.
export const LEG_LANDMARKS=[
 [{x:153,hip:410,knee:458,sole:511},{x:218,hip:410,knee:458,sole:511}],
 [{x:191,hip:417,knee:459,sole:515},{x:254,hip:417,knee:459,sole:512}],
 [{x:233,hip:411,knee:459,sole:516}],
 [{x:163,hip:418,knee:463,sole:511},{x:220,hip:418,knee:463,sole:514}],
 [{x:153,hip:384,knee:434,sole:481},{x:215,hip:384,knee:434,sole:481}],
 [{x:163,hip:384,knee:435,sole:483},{x:216,hip:384,knee:435,sole:483}],
 [{x:135,hip:383,knee:434,sole:480}],
 [{x:124,hip:386,knee:436,sole:483},{x:178,hip:386,knee:436,sole:483}]
];
export const LEG_DIVIDERS=[186,218,null,192,185,195,null,144];
export const STRIDE=.64;
const TAU=2*Math.PI;
export const smoothstep=(lo,hi,v)=>{const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));return t*t*(3-2*t)};
// 60% stance, 40% swing. In stance the planted foot moves backwards at the
// character's ground speed; the swing follows a zero-slope eased curve.
export function footCycle(phase){
 const p=((phase/TAU)%1+1)%1,stance=.6;
 if(p<stance)return {along:STRIDE*(stance/2-p),lift:0,stance:true};
 const t=(p-stance)/(1-stance),s=t*t*(3-2*t);
 return {along:STRIDE*stance*(s-.5),lift:Math.sin(Math.PI*t)*.09,stance:false};
}
export function projectGround(dx,dz,offset){
 const h=Math.hypot(offset.x,offset.z),length=Math.hypot(h,offset.y);
 return {x:(dx*offset.z-dz*offset.x)/h,y:-(dx*offset.x+dz*offset.z)/h*Math.abs(offset.y)/length,z:(dx*offset.x+dz*offset.z)/length};
}
export function updateBlend(value,target,dt,rate=12){return value+(target-value)*(1-Math.exp(-Math.max(0,dt)*rate))}
export function shadowTriangleValid(a,b,c){return Math.max(a,b,c)-Math.min(a,b,c)<.025}
