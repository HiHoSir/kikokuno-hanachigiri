import * as THREE from 'three';
import {CAMERA_OFFSET} from './movement.js';

// Placeholder character only; source image dimensions are not a production constraint.
export function createCharacter(scene){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
  const g=canvas.getContext('2d');
  g.fillStyle='#b53141';g.fillRect(44,102,40,59);g.fillStyle='#f7e5d3';g.fillRect(49,101,29,36);
  g.fillStyle='#58376c';g.beginPath();g.ellipse(64,69,34,38,0,0,Math.PI*2);g.fill();
  g.fillStyle='#f6c8a8';g.beginPath();g.ellipse(64,78,23,26,0,0,Math.PI*2);g.fill();
  g.fillStyle='#bc354a';g.beginPath();g.ellipse(36,59,16,10,.35,0,Math.PI*2);g.ellipse(92,59,16,10,-.35,0,Math.PI*2);g.fill();
  g.fillStyle='#deba62';g.beginPath();g.moveTo(59,55);g.lineTo(64,26);g.lineTo(69,55);g.fill();
  g.fillStyle='#572b37';g.fillRect(53,80,6,4);g.fillRect(73,80,6,4);
  g.fillStyle='#faf4e7';g.fillRect(50,124,28,21);g.fillStyle='#6b3a3e';g.fillRect(47,154,13,20);g.fillRect(68,154,13,20);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const height=1.88;
  const hero=new THREE.Mesh(new THREE.PlaneGeometry(1.25,height),new THREE.MeshBasicMaterial({
    map:texture,transparent:true,alphaTest:.35,depthTest:true,depthWrite:true,side:THREE.DoubleSide
  }));
  hero.rotation.y=Math.atan2(CAMERA_OFFSET.x,CAMERA_OFFSET.z);
  scene.add(hero);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.3,24),new THREE.MeshBasicMaterial({
    color:0x141d17,transparent:true,opacity:.25,depthWrite:false
  }));
  shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  return {
    setPosition(x,z,surfaceY=0){hero.position.set(x,height/2+.02,z);shadow.position.set(x,surfaceY+.006,z)},
    dispose(){scene.remove(hero,shadow);hero.geometry.dispose();hero.material.dispose();texture.dispose();shadow.geometry.dispose();shadow.material.dispose()}
  };
}
