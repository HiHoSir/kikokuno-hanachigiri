const canvas=document.querySelector('#stage'),c=canvas.getContext('2d');let mode='idle',t=0,prev=0;
const desc={idle:'待機：呼吸と髪の揺れ',walk:'歩行：左右の脚と袖を交互に動かす',talk:'会話：うなずきと手振り',surprise:'驚き：跳ねる・腕を広げる'};
const oval=(x,y,rx,ry,col)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill()};
const shape=(pts,col)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='#433441';c.lineWidth=2;c.stroke()};
function pivot(x,y,a,fn){c.save();c.translate(x,y);c.rotate(a);fn();c.restore()}
function limb(x,angle){pivot(x,20,angle,()=>{shape([[-9,0],[9,0],[9,57],[-8,57]],'#efc0ac');shape([[-11,50],[12,50],[13,76],[-13,76]],'#382b41');shape([[-12,67],[15,67],[18,81],[-13,81]],'#a7364e')})}
function sleeve(side,angle){pivot(side*31,-65,angle,()=>{shape([[0,0],[side*18,8],[side*25,65],[side*3,67]],'#f2e5db');shape([[side*12,49],[side*25,65],[side*3,67]],'#bd3a4f');oval(side*15,65,8,8,'#f1bda8')})}
function render(ms){
 const dt=Math.min(.05,(ms-prev)/1000||0);prev=ms;t+=dt*Number(document.querySelector('#speed').value)/100;
 const amp=Number(document.querySelector('#amount').value)/100,phase=t*8;
 const walking=mode==='walk',talk=mode==='talk',surprise=mode==='surprise';
 const swing=walking?Math.sin(phase)*.4*amp:0;
 const bob=walking?Math.abs(Math.sin(phase))*6*amp:Math.sin(t*2)*2*amp;
 const leap=surprise?Math.abs(Math.sin(t*3))*19*amp:0;
 c.fillStyle='#82a977';c.fillRect(0,0,560,700);
 c.fillStyle='#bba57d';c.fillRect(0,435,560,265);
 c.fillStyle='#946b4b';c.fillRect(325,155,210,210);c.fillRect(340,80,25,315);c.fillRect(500,80,25,315);
 c.fillStyle='#cbb08a';c.fillRect(315,370,235,25);
 oval(280,565,48-leap*.7,12,'#617359');
 c.save();c.translate(280,540-bob-leap);
 // Back hair, shoes and legs.
 oval(0,-100,45,95,'#40304e');
 limb(-17,swing);limb(17,-swing);
 shape([[-35,-69],[35,-69],[39,16],[0,38],[-40,16]],'#f7e7df');
 shape([[-31,-31],[31,-31],[24,25],[0,39],[-26,25]],'#ba3e54');
 sleeve(-1,-swing*.5-(surprise?.7:0));
 sleeve(1,swing*.5+(surprise?.7:talk?.25*Math.sin(phase):0));
 shape([[-29,-33],[29,-33],[27,-15],[-27,-15]],'#4c375f');
 oval(0,-19,10,9,'#e7bb6c');
 // Head and face; ribbon and a SINGLE GOLD HORN.
 pivot(0,-123,talk?.07*Math.sin(phase):0,()=>{
  oval(0,0,42,44,'#43304e');
  oval(0,14,31,30,'#f3c0b1');
  shape([[-39,-5],[-30,-34],[-1,-31],[13,-26],[35,-30],[40,-4],[26,-13],[10,-18],[-5,-5],[-21,-13]],'#483452');
  shape([[-5,-35],[5,-67],[13,-34],[8,-24]],'#eac568');
  pivot(-36,-25,Math.sin(phase*.25)*.07,()=>{shape([[0,0],[-31,-26],[-31,6],[0,9]],'#c63b54');shape([[0,0],[1,-23],[21,-15],[10,8]],'#d84e60');oval(0,0,7,7,'#e7c074')});
  for(const x of [-13,13]){oval(x,14,6,8,'#9c445c');oval(x-2,11,2,3,'#fff4f2')}
  oval(0,34,3,talk?5:2,'#a8535b');
 });
 c.restore();
 c.fillStyle='#fff2d4';c.font='bold 18px system-ui';c.fillText(desc[mode],16,32);
 requestAnimationFrame(render)
}
function setMode(m){mode=m;document.querySelector('#details').textContent=desc[m];document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m))}
const modes=['idle','walk','talk','surprise'];
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
canvas.addEventListener('click',()=>setMode(modes[(modes.indexOf(mode)+1)%4]));
for(const [input,output] of [['amount','amountText'],['speed','speedText']])document.querySelector('#'+input).addEventListener('input',e=>document.querySelector('#'+output).textContent=e.target.value+'%');
setMode('idle');requestAnimationFrame(render);
