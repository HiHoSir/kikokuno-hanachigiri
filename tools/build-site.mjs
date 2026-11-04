// Publish only the current runtime. Archive/skills/tests never enter Pages.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname),out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const item of ['index.html','demo-3d2d.html','demo-3d2d-oblique.html','demo-3d2d-textured-v4.html','demo-3d2d-woodgrain-v5.html','demo-3d2d-watercolor-v6.html','demo-3d2d-landscape-v7.html','demo-3d2d-sakura-layers-v8.html','demo-3d2d-sakura-shared-character-v9.html','demo-3d2d-sakura-roots-v10.html','demo-3d2d-sakura-roots-2d-v11.html','src','maps','assets'])fs.cpSync(path.join(root,item),path.join(out,item),{recursive:true,filter:source=>path.basename(source)!=='old'});
const inspect=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name==='old')throw Error('Archive leaked into publication');inspect(p);}else if(/\.(js|html|json)$/.test(e.name)&&/(?:["'`])(?:\.\.\/)*old\//.test(fs.readFileSync(p,'utf8')))throw Error('Current runtime references archive: '+p);}};
inspect(out);console.log('Built current map runtime only: dist/ (archive excluded)');
