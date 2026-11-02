import fs from 'node:fs';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../old/ARCHIVE_MANIFEST.json',import.meta.url))),root=new URL('../',import.meta.url);
let count=0;
for(const item of manifest.files.filter(x=>x.archived)){
 const data=fs.readFileSync(new URL(item.path,root));
 const actual=crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
 if(actual!==item.git_blob)throw Error('Archive changed or incomplete: '+item.path);
 count++;
}
const original=fs.readFileSync(new URL(manifest.snapshot+'/experiments/pixel-zigzag-v1/normal.png',root));
const current=fs.readFileSync(new URL('assets/characters/hizuki-v35/normal.png',root));
if(!original.equals(current))throw Error('Approved normal Hizuki image changed');
console.log(`Archive verified: ${count} original blobs unchanged; approved Hizuki PNG identical.`);
