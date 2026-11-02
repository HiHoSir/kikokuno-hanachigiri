// Each motion retains its original cell and model-origin anchor. No per-frame trimming.
export function validateMotions(config){
 if(!config.motions)return;
 const directions=['front','front_right','right','back_right','back','back_left','left','front_left'];
 for(const m of Object.values(config.motions)){
  if(!m||typeof m.image!=='string'||!m.image||!Array.isArray(m.size)||m.size.length!==2||!m.size.every(n=>Number.isInteger(n)&&n>0)||!Array.isArray(m.anchor)||m.anchor.length!==2||!m.anchor.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=m.size[i])||!Number.isInteger(m.frames)||m.frames<=0||!Number.isFinite(m.durationMs)||m.durationMs<=0||!Array.isArray(m.directions)||m.directions.length!==8||!directions.every(d=>m.directions.includes(d)))throw new Error('モーションのセル・足元・方向・時間が不正です');
 }
 if(!config.motions.walking||!config.motions.running||!config.motions.fall)throw new Error('歩行・走行・仮停止姿勢がありません');
 for(const id of ['walking','running'])if(!Number.isFinite(config.motions[id].strideMetres)||config.motions[id].strideMetres<=0)throw new Error('1周期の移動距離が不正です');
 if(!Number.isFinite(config.runSpeed)||config.runSpeed<=0)throw new Error('走行速度が不正です');
}
export class MotionPlayer{
 constructor(config){this.config=config;this.id='standing';this.facing='front_right';this.time=0;this.phase=0;this.preview=false;}
 get busy(){return this.preview;}
 play(id,facing=this.facing){const m=this.config.motions[id];if(!m||!m.directions.includes(facing))throw new Error('未登録のモーションまたは方向です');this.id=id;this.facing=facing;this.time=0;this.phase=0;this.preview=true;}
 cancel(){this.id='standing';this.time=0;this.phase=0;this.preview=false;}
 update(dt,{moving=false,running=false,facing=this.facing,distance=0}={}){
  if(this.preview){this.time+=Math.max(0,dt);const m=this.config.motions[this.id];if(!m.loop&&!m.holdLast&&this.time>=m.durationMs)this.cancel();return;}
  const next=moving?(running?'running':'walking'):'standing';
  this.facing=facing;
  if(next==='standing'){this.id=next;this.phase=0;return;}
  if(this.id==='standing')this.phase=0;
  this.id=next;
  // Only real world displacement advances gait. dt is reserved for stationary previews/actions.
  this.phase=(this.phase+Math.max(0,Number.isFinite(distance)?distance:0)/this.config.motions[next].strideMetres)%1;
 }
 get current(){
  const m=this.config.motions[this.id==='standing'?'fall':this.id];
  const time=m.loop?this.time%m.durationMs:Math.min(this.time,m.durationMs-Number.EPSILON);
  const phase=!this.preview&&this.id!=='standing'?this.phase:time/m.durationMs;
  const frame=this.id==='standing'?0:Math.min(m.frames-1,Math.floor((phase+1e-10)*m.frames));
  return {id:this.id,facing:this.facing,frame,phase:this.id==='standing'?0:phase,image:m.image,rect:[frame*m.size[0],m.directions.indexOf(this.facing)*m.size[1],...m.size],anchor:m.anchor};
 }
}
