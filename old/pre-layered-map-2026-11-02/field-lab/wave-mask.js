import {smoothstep} from './rig.js';

// Source-pixel boundary follows the raised palm/forearm, not the right side
// of the entire sprite. Leave a safety band against the hair bow behind it.
export function waveWeight(x,y){
 const left=y<550?835-(y-500)*.5:810;
 return smoothstep(490,535,y)*smoothstep(left,left+25,x)*(1-smoothstep(690,840,y));
}
