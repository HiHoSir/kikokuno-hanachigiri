// Original technology-test area. Geometry is in world units, never source pixels.
export const demoArea={
 id:'prototype-teahouse', name:'2.5D検証用の茶屋', bounds:19,
 spawn:{x:0,z:3.6},
 // Ground and raised wooden floor upper surfaces, highest matching surface wins.
 walkSurfaces:[{x:0,z:0,w:21,d:21,height:-0.015},{x:0,z:0,w:2.5,d:2,height:0.015}],
 blocks:[
  [0,-.24,0,42,.45,42,0x75a16c,false],
  [0,-.01,0,5,.05,4,0xb9a67b,false],
  [0,.26,-2,6,.48,2.3,0x785441,true],
  ...[-2.6,2.6].flatMap(x=>[-2.5,.5].map(z=>[x,1.45,z,.3,2.9,.3,0x8e543d,true])),
  [0,3,-2.7,6.6,.34,.7,0x405460,false],
  [0,.23,-.6,1.6,.4,1.2,0xa47a49,true],
  ...[-.7,.7].map(x=>[x,.07,.85,.64,.13,.62,0x698c89,false]),
  ...[[-6,-3],[6,-4],[-6,5],[6,5],[9,0]].map(([x,z])=>[x,.55,z,.32,1.1,.32,0x78513c,true]),
  [5,.5,1,.8,1,.65,0x9b9d92,true]
 ],
 trees:[[-6,-3],[6,-4],[-6,5],[6,5],[9,0]],
 interactions:[
  {id:'stone',x:5,z:1,range:2.5,trigger:'action',once:false,text:'石碑：「ここは立体背景の実験場です。」'},
  {id:'teahouse-sign',x:0,z:1.65,range:1.4,trigger:'action',once:false,text:'茶屋：「ここでは2Dと3Dの重なりを検証できます。」'}
 ],
 defaultAction:'仮キャラクター：「茶屋の柱の前後を歩いてみよう！」'
};
