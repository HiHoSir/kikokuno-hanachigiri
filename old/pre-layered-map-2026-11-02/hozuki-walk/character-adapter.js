import * as THREE from 'three';
import {createLabCharacter} from '../field-lab/character.js?v=0.33.0';
import {STRIDE} from '../field-lab/rig.js?v=0.12.1';
import {motionPose} from './motion-controller.js?v=0.31.0';

// Reuse the identical mesh-deformation renderer that runs in the main game.
// This transparent renderer is composited onto the illustration in screen space.
export async function createIllustratedCharacter(){
 const canvas=document.createElement('canvas');
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(1);
 renderer.setSize(300,400,false);
 renderer.setClearColor(0,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-1.25,1.25,1.6667,-1.6667,.1,100);
 const target=new THREE.Vector3(0,1,0);
 camera.position.set(11,15,17);camera.lookAt(target);camera.updateProjectionMatrix();
 const character=await createLabCharacter(scene,'../field-lab/');
 let stride=0;
 return {
   draw(ctx,p,scale,worldY,direction,moving,dx,dy,now,dt,mode,elapsed){
     const frame=now/1000;
     if(moving)stride+=Math.hypot(dx,dy)/(Math.max(worldY,.01)/2)/STRIDE*Math.PI*2;
     const velocity={x:dx,z:dy};
     character.update({
       x:0,y:0,z:0,dt,time:frame,direction,phase:stride,
       moving,velocity,camera,mode:mode||'idle',actionElapsed:elapsed,
       source:0,originalReactions:false,groundAt:()=>0,debug:false
     });
     renderer.render(scene,camera);
     const displayedHeight=worldY*scale;
     const fullHeight=3.3334;
     const fullDrawHeight=displayedHeight*fullHeight/2;
     const fullDrawWidth=fullDrawHeight*(300/400);
     // Subject feet are placed at the image coordinates, never resized by camera mode.
     const heightAboveFeet=(1.6667+1)*fullDrawHeight/fullHeight;
     const pose=motionPose({mode:mode||'idle',elapsed,clock:frame,phase:stride,moving});
     // Original artwork is still rendered at exactly the same scale and foot anchor.
     // Motion-demo drives translation/lean only; the 8-way original rig handles limbs.
     ctx.save();
     ctx.translate(p.x+pose.x*displayedHeight,p.y+pose.y*displayedHeight);
     ctx.rotate(pose.angle);
     ctx.drawImage(canvas,-fullDrawWidth/2,-heightAboveFeet,fullDrawWidth,fullDrawHeight);
     ctx.restore();
   },
   dispose(){renderer.dispose()}
 };
}
