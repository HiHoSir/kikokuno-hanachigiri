/** The canonical Canvas2D sprite draw shared by the playable map and 3D→2D scenery demos. */
export function drawCharacterFrame(ctx,hero,frame,foot){
 if(!hero?.config||!frame||!foot)throw new Error('キャラクター描画情報が不足しています');
 const config=hero.config,image=hero.images.get(frame.image);
 if(!image)throw new Error('キャラクター画像が読み込まれていません: '+frame.image);
 const anchor=frame.anchor||config.anchor;
 ctx.save();
 ctx.imageSmoothingEnabled=frame.smooth===true||!config.pixelArt;
 if(frame.smooth===true)ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,...frame.rect,foot.x-anchor[0]*config.scale,foot.y-anchor[1]*config.scale,frame.rect[2]*config.scale,frame.rect[3]*config.scale);
 ctx.restore();
}
