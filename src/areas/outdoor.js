// A second original test area; no external art assets.
export const outdoorArea={
 id:'outdoor-path',name:'茶屋の外れ道',bounds:19,spawn:{x:0,z:3.8},
 walkSurfaces:[{x:0,z:0,width:42,depth:42,top:-.015}],
 blocks:[
  [0,-.24,0,42,.45,42,0x7caa73,false],
  [0,-.007,0,3.2,.018,16,0xc5ad7e,false],
  [0,.9,-5,3.2,1.8,.35,0x9a4d40,false],
  [0,1.95,-5,4,.32,.9,0x36476b,false],
  [-3,.32,-2,1.4,.65,1.3,0x90958a,true],
  [3,.38,-3,1.4,.75,1.25,0x9c9687,true]
 ],trees:[[-6,-3],[6,-4],[-6,5],[6,5]],
 npcs:[{id:'traveler',x:1.8,z:1.3,color:0x496d9a,name:'旅人'}],
 interactions:[
  {id:'outdoor-return',x:0,z:4,range:1.1,trigger:'action',text:'茶屋へ戻ります。',transition:{to:'prototype-teahouse',spawn:{x:0,z:3.6}}},
  {id:'traveler',x:1.8,z:1.3,range:1.65,trigger:'action',text:'旅人：「この先にも道が続いているそうですよ。」',flag:'metTraveler',afterText:'旅人：「また会いましたね。」'}
 ],defaultAction:'街道の風が心地よい。'
};