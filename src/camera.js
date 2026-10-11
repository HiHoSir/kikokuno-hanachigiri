import * as THREE from 'three';
import {CAMERA_OFFSET} from './movement.js';
export function createCameraController(camera){
  const target=new THREE.Vector3(),offset=new THREE.Vector3(CAMERA_OFFSET.x,CAMERA_OFFSET.y,CAMERA_OFFSET.z);
  return {
    resize(width,height){const half=5.6;camera.left=-half*width/height;camera.right=half*width/height;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()},
    update(player,dt,height=0){target.lerp(new THREE.Vector3(player.x,height,player.z),1-Math.exp(-Math.max(0,dt)*8));camera.position.copy(target).add(offset);camera.lookAt(target)},
    target
  };
}
