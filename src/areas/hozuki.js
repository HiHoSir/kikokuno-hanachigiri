// Original, exploratory 2.5D hometown. All coordinates are game-world units.
export const hozukiArea={
 id:'hozuki-village',name:'鬼灯の里 — 散策実験 v0.15.0',bounds:19,
 spawn:{x:3,z:13.1},
 walkSurfaces:[{x:0,z:0,width:38,depth:38,top:0}],
 // Southern graded approach to the raised wind-bell shrine.
 // Kept separate from flat rectangles to prevent vertical teleporting at the stair edge.
 elevation:{xMin:9.65,xMax:12.95,zTop:-11.5,zBottom:-10.55,height:.55,plateau:{xMin:7.55,xMax:15.05,zMin:-17.45,zMax:-11.5}},
 blocks:[], trees:[], portals:[],npcs:[],
 interactions:[
  {id:'pot-smith',kind:'pot',x:-9.2,z:2.1,range:1.65,trigger:'action',text:'壺の底から薬草を見つけた！'},
  {id:'pot-tea',kind:'pot',x:13,z:2.5,range:1.65,trigger:'action',text:'壺の中に薬草があった！'},
  {id:'well',kind:'well',x:-3,z:1.2,range:2.1,trigger:'action',text:'冷たい井戸水を飲んだ。体力が回復した！'},
  {id:'vegetables',kind:'vegetable',x:10.5,z:3.7,range:2.4,trigger:'action',text:'鬼灯の里の特産野菜を収穫した！'},
  {id:'forge',x:-10,z:-3.4,range:2,trigger:'action',text:'兵具屋：「この島を守るため、昔から道具を鍛えている。」'},
  {id:'inn',x:0,z:-5.5,range:2,trigger:'action',text:'宿屋：「ここは鬼たちのふるさと。どうぞゆっくりお休み。」'},
  {id:'tea',x:11,z:-4.3,range:2,trigger:'action',text:'茶店：「鬼灯茶はいかが？　島の草花を煎じたお茶だよ。」'},
  {id:'home',x:-12,z:-11,range:2,trigger:'action',text:'ここは主人公の生家。懐かしい木の香りがする。'},
  {id:'bell',x:11.5,z:-13.6,range:2.4,trigger:'action',text:'風魔の鈴は、もう鳴らない……。かつて島を外の世界から隠していたのに。'},
  {id:'river',x:-5,z:7.8,range:1.5,trigger:'action',text:'澄んだ小川。小魚が静かに泳いでいる。'}
 ],
 defaultAction:'草木が揺れ、水のせせらぎが聞こえる。'
};
