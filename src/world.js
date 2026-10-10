import * as THREE from 'three';

// Rendering adapter: accepts declarative area geometry and returns physics bounds.
export function createWorld(scene,area){
  scene.background=new THREE.Color('#b3ccbd');
  scene.fog=new THREE.Fog('#b3ccbd',20,44);
  scene.add(new THREE.HemisphereLight(0xfff6e2,0x657d68,2));
  const sun=new THREE.DirectionalLight(0xffecc0,2.2);
  sun.position.set(-7,14,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});
  scene.add(sun,sun.target);

  const obstacles=[];
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:1});
  for(const [x,y,z,w,h,d,color,collide] of area.blocks){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
    if(collide)obstacles.push({x,z,w:w/2,d:d/2});
  }
  for(const [x,z] of area.trees||[]){
    const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.32,1),material(0x427e55));
    tree.position.set(x,2,z);tree.castShadow=true;scene.add(tree);
    obstacles.push({x,z,w:.6,d:.6});
  }
  return {obstacles,sun};
}
