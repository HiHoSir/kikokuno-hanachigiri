// Provisional in-game sprite reflecting the heroine's red horns, purple hair and crimson kimono.
// Canvas drawing stays replaceable by final directional frames.
export function drawHero(canvas){
 canvas.width=128;canvas.height=176;
 const g=canvas.getContext('2d');
 g.clearRect(0,0,128,176);
 const poly=(pts,color,stroke='#372535')=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle=stroke;g.lineWidth=2;g.stroke()};
 const ell=(x,y,rx,ry,color)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill()};
 // Flowing hair behind the silhouette.
 poly([[40,38],[19,72],[21,130],[10,145],[29,136],[37,148],[43,126],[90,131],[103,145],[112,134],[104,99],[89,37]],'#39283f');
 poly([[42,21],[26,13],[31,41],[46,46]],'#a83f50');
 poly([[83,21],[98,11],[95,40],[79,46]],'#aa4252');
 poly([[42,24],[33,13],[36,34],[45,41]],'#ed8890','#8e3746');
 poly([[85,24],[94,11],[91,36],[81,42]],'#ed8890','#8e3746');
 // Legs and footwear.
 poly([[48,124],[61,124],[60,157],[47,157]],'#f1b8a1');
 poly([[68,124],[81,124],[81,157],[68,157]],'#f1b8a1');
 poly([[45,151],[62,150],[62,165],[43,166]],'#302b35');
 poly([[67,151],[84,151],[86,166],[65,165]],'#302b35');
 poly([[44,159],[62,159],[62,168],[42,168]],'#a53741');
 poly([[66,159],[86,159],[88,168],[65,168]],'#a53741');
 // Wide sleeves and layered robe.
 poly([[42,82],[20,93],[13,125],[28,131],[45,112]],'#b62b40');
 poly([[86,82],[110,96],[115,126],[100,132],[81,109]],'#b62b40');
 poly([[23,102],[17,119],[31,122]],'#241f30');
 poly([[105,103],[111,120],[97,121]],'#241f30');
 poly([[41,78],[87,78],[95,130],[64,145],[33,129]],'#96283c');
 poly([[43,82],[64,108],[82,80],[90,113],[64,137],[36,112]],'#312533');
 poly([[40,126],[65,140],[91,126],[84,143],[65,149],[43,141]],'#db4a53');
 poly([[43,80],[65,101],[83,80],[78,91],[65,112],[48,92]],'#efe3d7');
 poly([[42,105],[86,105],[88,117],[41,117]],'#b22d41');
 poly([[48,109],[79,109],[78,114],[49,114]],'#f4c578');
 ell(64,112,8,7,'#e2b85d');
 // Hair and face.
 ell(64,58,37,41,'#35283c');
 ell(64,70,26,26,'#f4c4b0');
 poly([[34,59],[40,35],[53,33],[63,48],[74,34],[91,43],[94,63],[78,57],[70,51],[58,64],[45,53]],'#3f2b49');
 ell(53,74,4,5,'#9a344f');ell(75,74,4,5,'#9a344f');
 ell(52,73,2,2,'#eedcde');ell(74,73,2,2,'#eedcde');
 ell(64,85,2,1,'#a85260');
 // Ribbon, hair ornaments, stylized floral accents.
 poly([[81,37],[97,28],[98,49],[82,45]],'#b33046');
 poly([[82,38],[79,29],[71,34],[76,46]],'#bf4650');
 ell(83,39,5,5,'#e3b95f');
 for(const [x,y] of [[26,111],[104,113],[54,131],[78,131]]){ell(x,y,3,3,'#eccb92');ell(x-4,y,2,2,'#f5e4d0');ell(x+4,y,2,2,'#f5e4d0')}
 // Braided sash and hanging tassels.
 poly([[59,117],[64,125],[69,117],[67,139],[64,146],[61,139]],'#d9ab57');
 return {width:128,height:176,footY:169};
}
