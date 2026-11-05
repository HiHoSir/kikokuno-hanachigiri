import fs from 'node:fs';
import zlib from 'node:zlib';

function pngPixels(path) {
  const data = fs.readFileSync(path);
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  if(!data.subarray(0,8).equals(sig))throw Error('invalid PNG: '+path);
  let at=8,w=0,h=0,depth=0,type=0,interlace=0,parts=[];
  while(at<data.length){
    const n=data.readUInt32BE(at),kind=data.toString('ascii',at+4,at+8),chunk=data.subarray(at+8,at+8+n);
    if(kind==='IHDR'){w=chunk.readUInt32BE(0);h=chunk.readUInt32BE(4);depth=chunk[8];type=chunk[9];interlace=chunk[12];}
    if(kind==='IDAT')parts.push(chunk);
    at+=12+n;
    if(kind==='IEND')break;
  }
  if(depth!==8||interlace!==0||![2,6].includes(type))throw Error('Only RGB/RGBA 8-bit PNG supported: '+JSON.stringify({depth,type,interlace,path}));
  const bpp=type===6?4:3,stride=w*bpp;
  const zip=zlib.inflateSync(Buffer.concat(parts));
  if(zip.length!==(stride+1)*h)throw Error(`Unexpected decoded size ${zip.length}`);
  const result=new Uint8Array(w*h*4),old=new Uint8Array(stride),line=new Uint8Array(stride);
  let offset=0;
  for(let y=0;y<h;y++){
    const filter=zip[offset++];
    for(let x=0;x<stride;x++){
      const src=zip[offset++],left=x>=bpp?line[x-bpp]:0,up=old[x],uleft=x>=bpp?old[x-bpp]:0;
      let extra=0;
      if(filter===1)extra=left;
      else if(filter===2)extra=up;
      else if(filter===3)extra=Math.floor((left+up)/2);
      else if(filter===4){const p=left+up-uleft,aa=Math.abs(p-left),bb=Math.abs(p-up),cc=Math.abs(p-uleft);extra=aa<=bb&&aa<=cc?left:bb<=cc?up:uleft;}
      else if(filter!==0)throw Error('Unsupported filter '+filter);
      line[x]=(src+extra)&255;
    }
    for(let x=0;x<w;x++){
      const src=x*bpp,dst=4*(y*w+x);
      result[dst]=line[src];result[dst+1]=line[src+1];result[dst+2]=line[src+2];result[dst+3]=bpp===4?line[src+3]:255;
    }
    old.set(line);
  }
  return {width:w,height:h,pixels:result};
}
function spriteFeatures(image,{cellWidth,cellHeight,dir=1,frame=0}){
  const {width,height,pixels}=image;
  const sx=frame*cellWidth,sy=dir*cellHeight;
  let x0=cellWidth,y0=cellHeight,x1=0,y1=0;
  for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++){
    let a=pixels[4*((sy+y)*width+sx+x)+3];if(a>128){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  }
  if(x1<=x0||y1<=y0)throw Error('Empty sprite');
  const bboxHeight=y1-y0;
  const labels=['all','top45-blue','upper55-red','top45-all'];
  const st=Object.fromEntries(labels.map(l=>[l,{n:0,RGB:[0,0,0],Y:0}]));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const k=4*((sy+y)*width+(sx+x)),a=pixels[k+3];if(a<220)continue;
    const r=pixels[k],g=pixels[k+1],b=pixels[k+2],yr=(y-y0)/bboxHeight;
    const blue=b>r+22&&g>r+10&&b>g-5;
    const red=r>g*1.32&&r>b*1.05;
    const types=['all'];if(yr<.45&&blue)types.push('top45-blue');if(yr<.55&&red)types.push('upper55-red');if(yr<.45)types.push('top45-all');
    for(const t of types){const o=st[t];o.n++;o.RGB[0]+=r;o.RGB[1]+=g;o.RGB[2]+=b;o.Y+=r*.2126+g*.7152+b*.0722;}
  }
  for(const x of Object.values(st))if(x.n){x.RGB=x.RGB.map(v=>Math.round(v/x.n*10)/10);x.Y=Math.round(x.Y/x.n*10)/10;}
  return {bbox:[x0,y0,x1,y1],bboxHeight,stats:st};
}
function checkAtlas(label,path,cw,ch){let image=pngPixels(path),out={label,dimensions:[image.width,image.height],directions:{}};
 for(const [idx,name]of ['front','front_right','right','back_right','back','back_left','left','front_left'].entries())out.directions[name]=spriteFeatures(image,{cellWidth:cw,cellHeight:ch,dir:idx});return out;}
if(process.argv[1]?.endsWith('lighting_audit.mjs')){
 const items=[['idle','assets/characters/hizuki/v35-expanded-cells/idle_8dir.png',80,132],['walking','assets/characters/hizuki/v35-expanded-cells/walking_8dir.png',80,160],['running','assets/characters/hizuki/v35-expanded-cells/running_8dir.png',96,160],['katana_v44','assets/characters/hizuki/v35-expanded-cells/attack_katana_v44_corrected_8dir.png',224,256]];
 const report=items.map(([name,path,w,h])=>checkAtlas(name,path,w,h));
 for(const obj of report){
  console.log('\nLIGHT_AUDIT '+obj.label);
  for(const [dir,entry]of Object.entries(obj.directions))console.log(dir,'height='+entry.bboxHeight,'hair=',JSON.stringify(entry.stats['top45-blue']),'red=',JSON.stringify(entry.stats['upper55-red']));
 }
 const dirs=['front','front_right','right','back_right','back','back_left','left','front_left'];
 const final={comparison:dirs.map(d=>({direction:d,...Object.fromEntries(report.map(z=>[z.label,z.directions[d].stats['top45-blue']]))}))};
 fs.writeFileSync('/tmp/lighting-audit-v44.json',JSON.stringify({report,final},null,2));
}
export {pngPixels,spriteFeatures,checkAtlas};