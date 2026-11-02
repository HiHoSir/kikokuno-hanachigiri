import * as THREE from 'three';
import {CAMERA_OFFSET} from './movement.js';
import {anchorOffsetY} from './anchor.js';
import {drawHero} from './hero-art.js?v=0.8.1';

// Placeholder character only; source image dimensions are not a production constraint.
export function createCharacter(scene){
  const canvas=document.createElement('canvas');
  const art=drawHero(canvas);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;
  const height=1.88;
  // Placeholder shoes finish at canvas Y=174, not at the image boundary Y=192.
  const footOffset=anchorOffsetY(height,art.footY,canvas.height);
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
    setPosition(x,z,surfaceY=0){hero.position.set(x,surfaceY+height/2-footOffset+.006,z);shadow.position.set(x,surfaceY+.006,z)},
    dispose(){scene.remove(hero,shadow);hero.geometry.dispose();hero.material.dispose();texture.dispose();shadow.geometry.dispose();shadow.material.dispose()}
  };
}
