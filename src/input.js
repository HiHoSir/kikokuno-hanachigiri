const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0],upleft:[-1,-1],upright:[1,-1],downleft:[-1,1],downright:[1,1]};
const keyboard={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
export function createInput(onAction){
  const keys=new Set(),touch=new Map();
  function down(e){const key=keyboard[e.key];if(key){keys.add(key);e.preventDefault()}if(e.key==='Enter'||e.key===' '){onAction();e.preventDefault()}}
  function up(e){keys.delete(keyboard[e.key])}
  function clear(){keys.clear();touch.clear()}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
  const buttons=[...document.querySelectorAll('[data-dir]')];
  const handlers=[];
  for(const button of buttons){
    const begin=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.dir)};
    const end=e=>touch.delete(e.pointerId);
    button.addEventListener('pointerdown',begin);
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,end);
    handlers.push({button,begin,end});
  }
  const action=document.querySelector('#talk'),activate=e=>{e.preventDefault();onAction()};
  action.addEventListener('pointerdown',activate);
  return {
    getDirection(){
      let x=0,y=0;
      for(const name of [...keys,...touch.values()]){const v=directions[name];if(v){x+=v[0];y+=v[1]}}
      return {x,y};
    },
    dispose(){window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);action.removeEventListener('pointerdown',activate);
      for(const {button,begin,end} of handlers){button.removeEventListener('pointerdown',begin);for(const name of ['pointerup','pointercancel','lostpointercapture'])button.removeEventListener(name,end)}
    }
  };
}
