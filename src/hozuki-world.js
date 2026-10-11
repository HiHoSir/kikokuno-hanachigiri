import * as THREE from 'three';

// 2.5D scene built from independent solids instead of a flat backdrop.
export function createHozukiWorld(scene,area){
 const group=new THREE.Group();scene.add(group);
 scene.background=new THREE.Color('#c7c8b2');
 scene.fog=new THREE.Fog('#c7c8b2',30,72);
 const obstacles=[];
 const materials=new Map();
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.93,...extra});
 const getMat=color=>{if(!materials.has(color))materials.set(color,mat(color));return materials.get(color)};
 function box(x,y,z,w,h,d,color,collision=false){
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),getMat(color));
   mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=h>.25;group.add(mesh);
   if(collision)obstacles.push({x,z,w:w/2,d:d/2});
   return mesh;
 }
 function ball(x,y,z,r,color,scale=[1,1,1]){
   const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),getMat(color));
   mesh.position.set(x,y,z);mesh.scale.set(...scale);mesh.castShadow=true;group.add(mesh);return mesh;
 }
 function cylinder(x,y,z,rt,rb,h,color){
   const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,9),getMat(color));
   mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;
 }
 const ambient=new THREE.HemisphereLight(0xfff0d8,0x617d6b,2.3);group.add(ambient);
 const sun=new THREE.DirectionalLight(0xffd7a1,2.35);sun.position.set(-9,19,11);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25});
 group.add(sun,sun.target);
 box(0,-.28,0,38,.55,38,0x6a9862);
 // Paths read as walkable space, deliberately kept free of foliage and walls.
 const tracks=[[-10,0,22,3.7],[3,0,4,32],[10,0,15,3.8],[-12,-8,4,14],[11,-9,3.3,19]];
 for(const [x,z,w,d] of tracks)box(x,.015,z,w,.045,d,0xb3a17b);
 // A narrow stream crossing the front plaza, with a single real walkable bridge.
 box(0,.009,7.4,38,.03,3.35,0x418f9b);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(38,3.23),mat(0x61c5ce,{transparent:true,opacity:.57,metalness:.15,roughness:.23}));
 water.rotation.x=-Math.PI/2;water.position.set(0,.048,7.4);group.add(water);
 for(let x=-18;x<19;x+=2.6){
   ball(x,.14,5.65,.4,0x909a82,[1,.5,.7]);
   ball(x+1,.13,9.2,.37,0x8e9982,[1,.5,.7]);
 }
 // Water has banks; the bridge corridor (x 1..5) is the only crossing.
 for(const [x,w] of [[-11.9,14.2],[12.15,13.7]]){
   obstacles.push({x,z:7.4,w:w/2,d:1.62});
 }
 // Wooden bridge, traversable at ground level; rails are visual only.
 box(3,.13,7.4,4.6,.25,4.2,0xa77547);
 for(let z=5.5;z<=9.51;z+=.58)box(3,.28,z,4.5,.07,.09,0x764e34);
 for(let z=5.45;z<9.7;z+=1.04)for(const x of [.75,5.25]){
   box(x,.52,z,.13,1.05,.13,0x76533a);
 }
 for(const x of [.75,5.25])box(x,.95,7.4,.15,.1,4.3,0x76533a);
 // Island cliffs and green wooded limits.
 for(let i=0;i<30;i++){
   const x=-18.7+(i%15)*2.65,z=-18.2+Math.floor(i/15)*35;
   ball(x,.38,z,1.15,i%3?0x697b60:0x7a8273,[1,.55,1]);
 }
 function tree(x,z,s=1){
   cylinder(x,.85*s,z,.2*s,.27*s,1.7*s,0x72513c);
   ball(x,2.0*s,z,.95*s,0x47784b,[1.1,1,.98]);
   ball(x-.45*s,2.1*s,z+.19*s,.62*s,0x608f58);
   obstacles.push({x,z,w:.48*s,d:.48*s});
 }
 for(const [x,z,s] of [[-16,-15,1.4],[-7,-16,1.25],[3,-16,1.2],[16,-16,1.3],
  [-17,-6,1.3],[-17,2,1.1],[17,1,1.2],[16,12,1.2],[-16,13,1.3],[-9,13,1.1],
  [10,15,1.2],[-1,16,1.15],[16,-7,1.1]])tree(x,z,s);
 // A rocky spring and stepped waterfall feed the stream from the northern slope.
 for(const [x,z,r] of [[-14,-11,2.1],[-12.7,-10,1.8],[-13.5,-8,1.6],[-13,-6.3,1.25]]){
   ball(x,.65,z,r,0x7c8477,[1,.58,.8]);
   ball(x+.65,.55,z-.15,r*.52,0x5e775e,[1,.45,1]);
 }
 for(const [x,z,w] of [[-13,-11,1.5],[-12.9,-9.9,1.15],[-12.75,-8.6,1.0],[-12.3,-7.2,.85]]){
   box(x,.82,z,w,.055,.85,0x84c6bd);
   for(let k=0;k<3;k++)ball(x-w*.32+k*w*.32,.73,z+.35,.13,0xc1e3da,[1,.35,.8]);
 }
 // Hozuki plants give the settlement a distinct identity without urban decoration.
 function hozuki(x,z){
   cylinder(x,.35,z,.045,.06,.7,0x4f7746);
   for(const [dx,dz,h] of [[-.19,0,.55],[.2,.15,.76],[.04,-.22,.96]]){
     ball(x+dx,h,z+dz,.17,0xcb6e39,[.85,1.2,.8]);
     ball(x+dx*.55,h-.12,z+dz*.55,.16,0x5c8e50,[1.25,.5,.9]);
   }
 }
 for(const [x,z] of [[-15,-3],[-14,-2.6],[-6,-10],[-5.5,-10.1],[6,-5],[15,-4],
  [15,4.9],[7,4.8],[-5,3.7],[-6,4],[-13,11],[-12.3,11.7]])hozuki(x,z);
 // A local village is meant to feel handmade, not like a decorated city.
 // Each entrance is a real collision-free opening, scaled to the heroine (~2 world units high).
 // Front = positive Z, toward the village paths. Wall sections, not whole-box collisions.
 const doorways=[];
 function house(x,z,w,d,roof=0x484c4b,wall=0xa98d66,opening=2.35){
   const height=4.55,half=w/2,doorHalf=opening/2,front=z+d/2;
   const wallThickness=.22, sideWidth=half-doorHalf;
   // Interior floor and low threshold are traversable. The building has no solid collision box.
   box(x,.06,z,w,.12,d,0x927f5d);
   for(const sx of [-1,1]){
     box(x+sx*(half-wallThickness/2),height/2,z,wallThickness,height,d,wall,true);
     box(x+sx*(doorHalf+sideWidth/2),height/2,front,sideWidth,height,wallThickness,wall,true);
     box(x+sx*(doorHalf+.10),height/2,front+.13,.17,height,.17,0x6b503a,true);
     box(x+sx*(half-.4),height*.52,front+.15,.45,.65,.08,0xd7bd84);
   }
   box(x,height/2,z-d/2, w,height,wallThickness,wall,true);
   // Door opening clears over 3 world units with comfortable headroom.
   const clearHeight=3.42;
   box(x,(clearHeight+height)/2,front,(opening-.15),height-clearHeight,.24,0x745841);
   // Roof height is scaled against the actual sprite; no hide-the-roof workaround.
   const roofs=[];
   roofs.push(box(x,height+.08,z-d*.24,w+.65,.3,d*.55,roof));
   for(const sx of [-1,1])
     roofs.push(box(x+sx*(doorHalf+(half-doorHalf)/2),height+.08,front-d*.19,
       half-doorHalf+.42,.3,d*.58,roof));
   roofs.push(box(x,height+.13,front+.26,w+.6,.18,.32,roof));
   // Roofs remain visible: scaled structures provide actual head clearance.
   box(x,.055,front+.45,opening,.11,.72,0x9b8663);
   // Back-room blocking furniture prevents walking through the rear wall.
   doorways.push({x,z:front,width:opening,clearHeight,insideZ:front-.75});
   return {x,z,front};
 }
 house(-10,-6,5.8,4.7,0x4c4543,0xa98d66,2.8); // smithy
 house(0,-8,6.4,5.3,0x535b58,0xa98d66,3.25); // welcoming inn
 house(10,-6.7,5.5,4.4,0x63574a,0xa98d66,3.05); // open teahouse
 house(-12,-13.2,4.8,4.1,0x5b584f,0xa98d66,2.65); // birthplace
 house(-3,-14,3.6,3.8,0x5c574b,0xa98d66,2.35);
 house(4,-14.1,3.6,3.9,0x536054,0xa98d66,2.35);
 // Forge, signs and humble porch seating.
 box(-11.3,.66,-2.65,1.5,1.32,.55,0x68615a,true);
 box(-11.3,1.38,-2.65,1,.14,.6,0xc96232);
 box(-8.3,.48,-2.7,1.5,.95,.18,0x674e34);
 for(let i=0;i<3;i++)cylinder(-8.7+i*.44,.77,-2.7,.075,.075,1.5,0x868c91);
 box(10,.31,-3.5,2.8,.58,1.25,0x846747);
 for(const x of [8.8,11.2])box(x,.55,-3.5,.19,1,.19,0x74563f);
 // Well is open on all sides.
 cylinder(-3,.56,1.2,1.03,1.05,1.08,0x96988a);
 cylinder(-3,1.16,1.2,.8,.8,.08,0xb8a98e);
 box(-3,1.3,1.2,1.5,.08,1.5,0x486e75);
 for(const x of [-4.05,-1.95])box(x,1.35,1.2,.15,2.5,.15,0x70533c);
 box(-3,2.6,1.2,2.5,.2,2.12,0x4d5350);
 obstacles.push({x:-3,z:1.2,w:.9,d:.9});
 // Inspectable clay pots.
 for(const [x,z] of [[-9.2,2.1],[-8.35,2.0],[13,2.5],[14,2.8]]){
   cylinder(x,.45,z,.37,.28,.82,0x9f6048);
   ball(x,.9,z,.4,0xa56b4f,[1,.22,1]);
   obstacles.push({x,z,w:.32,d:.32});
 }
 // Vegetable beds with 2.5D foliage clusters.
 for(let j=0;j<3;j++){
   box(10.5,.115,3+j*.66,4.6,.18,.52,0x806144);
   for(let i=0;i<7;i++){
     const x=8.5+i*.65;
     ball(x,.34,3+j*.66,.18,(i+j)%3===0?0x75a24c:0x5e9247,[1,1.5,.8]);
     if((i+j)%4===0)ball(x,.25,3+j*.66,.115,0xd17c3d);
   }
 }
 // Orchard vegetables can be stepped up to, but not walked through.
 obstacles.push({x:10.5,z:3.75,w:2.25,d:1.28});
 // The hill's render geometry uses the same elevation specification as feet/collision.
 // Unlike the former 0.55-unit platform, the summit is nearly twice the heroine's height.
 const hill=area.elevation, summit=hill.height, p=hill.plateau;
 const rampLength=hill.zFront-hill.zTop;
 function slopeHeight(z){return summit*Math.max(0,Math.min(1,(hill.zFront-z)/rampLength));}
 function terrainMesh(vertices,indices,color){
   const geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);
   geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,getMat(color));mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);return mesh;
 }
 // Broad summit, skirted by stone faces. Approached by a visible winding earth path.
 const px0=p.xMin,px1=p.xMax,pz0=p.zMin,pz1=p.zMax;
 box((px0+px1)/2,summit-.22,(pz0+pz1)/2,px1-px0,.44,pz1-pz0,0x779164);
 for(const [cx,cz,w,d] of [
   [(px0+px1)/2,pz0,px1-px0,.22],
   [px0,(pz0+pz1)/2,.22,pz1-pz0],
   [px1,(pz0+pz1)/2,.22,pz1-pz0]
 ]){
   box(cx,summit/2,cz,w,summit,d,0x807968);
 }
 // Mesh the incline as a continuous surface: flat at its foot, full-height at the summit.
 const verts=[],inds=[],columns=12,rows=30;
 for(let row=0;row<=rows;row++){
   const t=row/rows,z=hill.zFront+(hill.zTop-hill.zFront)*t;
   const y=slopeHeight(z);
   for(let col=0;col<=columns;col++){
     const lateral=col/columns*2-1,x=hill.cx+lateral*hill.halfWidth;
     verts.push(x,y+.015,z);
   }
 }
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=row*(columns+1)+col,j=i+columns+1;
   inds.push(i,i+1,j,i+1,j+1,j);
 }
 terrainMesh(verts,inds,0xa5926d);
 // Rocky flanks conceal the underside of the climb while leaving the central path clear.
 for(const side of [-1,1]){
   const x=hill.cx+side*(hill.halfWidth+.36);
   for(let i=3;i<14;i++){
     const z=hill.zFront-(i/14)*rampLength,y=slopeHeight(z);
     ball(x,y*.48,z,.28+i*.038,i%3?0x777d69:0x898875,[1.2,Math.max(.4,y*.7),1.2]);
   }
 }
 // Only the upper plateau's sheer edges block lateral approaches.
 obstacles.push({x:px0-.1,z:(pz0+pz1)/2,w:.13,d:(pz1-pz0)/2});
 obstacles.push({x:px1+.1,z:(pz0+pz1)/2,w:.13,d:(pz1-pz0)/2});
 obstacles.push({x:(px0+px1)/2,z:pz0-.11,w:(px1-px0)/2,d:.13});
 // Shrine architecture is lifted together with the summit, not left embedded in the earth.
 for(const x of [8.9,13.7])for(const z of [-16,-13.1])
   box(x,summit+1.65,z,.23,3.3,.23,0x795440);
 box(11.3,summit+3.35,-14.4,6.1,.3,4.7,0x4e5048);
 cylinder(11.3,summit+.9,-14.2,.76,.85,1.7,0x899878);
 ball(11.3,summit+1.8,-14.2,.75,0xa8a67e,[1,.24,1]);
 obstacles.push({x:11.3,z:-14.2,w:.85,d:.85});
 // Moss and wildflowers near the edges. Deliberately not overbuilt.
 for(let i=0;i<70;i++){
   const x=-17+(i*7.31)%34,z=-17+(i*13.71)%34;
   if(Math.abs(z)<11 && Math.abs(x)<15)continue;
   ball(x,.16,z,.24,i%4?0x558d56:0xd8ccb0,[1,.6,1]);
 }
 // Clear fish can be seen swimming underneath the bridge.
 const fish=[];
 for(let i=0;i<9;i++){
   const m=ball(-15+i*3.55,.075,7.1+(i%3)*.45,.13,i%3?0xd79b66:0xe5d3a1,[1,.42,.52]);
   fish.push({m,x:m.position.x,z:m.position.z,phase:i*1.2});
 }
 // The sun and the distant coast are a lightweight atmospheric layer.
 ball(0,14,-29,2.15,0xffd89c);
 return {obstacles,doorways,sun,dispose(){
   group.traverse(object=>{if(object.isMesh){object.geometry.dispose(); if(!materialsHas(object.material))object.material.dispose()}});
   for(const m of materials.values())m.dispose();
   scene.remove(group);
  },
  update(t,player){
   for(const f of fish){f.m.position.x=f.x+Math.sin(t*.35+f.phase)*.4;f.m.position.z=f.z+Math.cos(t*.7+f.phase)*.11;}}
 };
 function materialsHas(m){for(const cached of materials.values())if(cached===m)return true;return false;}
}
