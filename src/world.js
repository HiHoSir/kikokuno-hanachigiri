import * as THREE from 'three';

// Temporary 3D test area; scenery and collision bounds share a single source.
export function createWorld(scene) {
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
  function block(x,y,z,w,h,d,color,collide=true){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
    if(collide)obstacles.push({x,z,w:w/2,d:d/2});
    return mesh;
  }
  block(0,-.24,0,42,.45,42,0x75a16c,false);
  block(0,-.01,0,5,.05,4,0xb9a67b,false);
  block(0,.26,-2,6,.48,2.3,0x785441);
  for(const x of [-2.6,2.6])for(const z of [-2.5,.5])
    block(x,1.45,z,.3,2.9,.3,0x8e543d);
  block(0,3,-2.7,6.6,.34,.7,0x405460,false);
  block(0,.23,-.6,1.6,.4,1.2,0xa47a49);
  for(const x of [-.7,.7])block(x,.07,.85,.64,.13,.62,0x698c89,false);
  for(const [x,z] of [[-6,-3],[6,-4],[-6,5],[6,5],[9,0]]){
    block(x,.55,z,.32,1.1,.32,0x78513c);
    const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.32,1),material(0x427e55));
    tree.position.set(x,2,z);tree.castShadow=true;scene.add(tree);
    obstacles.push({x,z,w:.6,d:.6});
  }
  block(5,.5,1,.8,1,.65,0x9b9d92);
  return {obstacles,sun};
}
