// Seconds since the button press, independent of the global clock and walking.
export const ACTIONS={talk:{duration:1.6,label:'会話'},surprise:{duration:1.8,label:'驚き'},wave:{duration:2.8,label:'手を振る'},bow:{duration:2.4,label:'おじぎ'},cheer:{duration:2.4,label:'喜ぶ'}};
export function actionPose(mode,elapsed){
 const spec=ACTIONS[mode];if(!spec||elapsed<0||elapsed>=spec.duration)return {strength:0,left:0,right:0,bow:0,jump:0};
 const t=elapsed/spec.duration,e=Math.min(1,t/.12,(1-t)/.2),pulse=Math.sin(t*Math.PI);
 const p={strength:e,left:0,right:0,bow:0,jump:0};
 if(mode==='surprise'){p.left=-.5*e;p.right=.5*e;p.jump=.095*Math.max(0,Math.sin(Math.min(1,t/.45)*Math.PI));}
 if(mode==='wave')p.right=(.5+.16*Math.sin(t*Math.PI*10))*e;
 if(mode==='cheer'){p.left=-.6*e;p.right=.6*e;p.jump=.055*Math.abs(Math.sin(t*Math.PI*3))*e;}
 if(mode==='bow')p.bow=.12*pulse*pulse;
 if(mode==='talk'){p.left=-.18*Math.sin(t*Math.PI*4)*e;p.right=.24*Math.sin(t*Math.PI*4+.8)*e;}
 return p;
}
// Shoulder anchors in the original pixels; the head and torso stay outside masks.
export const SHOULDERS=[[[139,282],[234,282]],[[165,285],[265,291]],[[222,291]],[[134,291],[230,286]],[[132,260],[238,260]],[[135,263],[230,265]],[[142,263]],[[102,264],[205,264]]];
