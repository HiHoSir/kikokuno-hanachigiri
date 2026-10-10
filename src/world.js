import * as THREE from 'three';

// Rendering adapter: accepts declarative area geometry and returns physics bounds.
export function createWorld(scene,area){
  scene.background=new THREE.Color('#b3ccbd');
  scene.fog=new THREE.Fog('#b3ccbd',20,44);
  const group=new THREE.Group();scene.add(group);
  const ambient=new THREE.HemisphereLight(0xfff6e2,0x657d68,2);group.add(ambient);
  const sun=new THREE.DirectionalLight(0xffecc0,2.2);
  sun.position.set(-7,14,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});
  group.add(sun,sun.target);

  const obstacles=[];
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:1});
  for(const [x,y,z,w,h,d,color,collide] of area.blocks){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    if(collide)obstacles.push({x,z,w:w/2,d:d/2});
  }
  for(const [x,z] of area.trees||[]){
    const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.32,1),material(0x427e55));
    tree.position.set(x,2,z);tree.castShadow=true;group.add(tree);
    obstacles.push({x,z,w:.6,d:.6});
  }
  for(const npc of area.npcs||[]){
    const person=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.62,4,8),material(npc.color||0x756c9a));
    person.position.set(npc.x,.77,npc.z);person.castShadow=true;person.receiveShadow=true;group.add(person);
    obstacles.push({x:npc.x,z:npc.z,w:.3,d:.3});
  }
  return {obstacles,sun,dispose(){
    group.traverse(object=>{if(object.isMesh){object.geometry.dispose();object.material.dispose()}});
    scene.remove(group);
  }};
}
