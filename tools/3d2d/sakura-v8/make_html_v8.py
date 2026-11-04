"""Create fully self-contained play-test, same v7 map logic, new cherry layers."""
from pathlib import Path
import base64,json
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'source/demo_template.html').read_text(encoding='utf-8')
source=source.replace('樹木・地形の再設計 v7','桜の2Dレイヤー化 v8').replace('樹木と地形を作り直した3D由来の2Dマップ','3D幹と2D花レイヤーで構築した桜のマップ')
source=source.replace('実GLBへUV貼付→PNG書出し／40°＋35°','桜：3D幹＋2D花3層／40°＋35°')
source=source.replace('景観改良ON','桜レイヤーON').replace('旧v6','旧v7')
source=source.replace('<button id="texture" aria-pressed="true">桜レイヤーON</button>', '<button id="texture" aria-pressed="true">桜レイヤーON</button><button id="layers">層を確認</button>')
# One controlled, anchored composite: the trunk stays at precisely the same x/z.
old="function imageAt(e){const selected=texturesEnabled?DATA:BEFORE;const meta=selected.metadata.assets[e.asset],im=(texturesEnabled?assets:beforeAssets)[e.asset],p=projection(e);ctx.drawImage(im,p.x-meta.anchor[0],p.y-meta.anchor[1]);}"
new="""function imageAt(e){
 const selected=texturesEnabled?DATA:BEFORE,meta=selected.metadata.assets[e.asset],p=projection(e);
 if(texturesEnabled&&e.asset==='sakura'){
  const parts=['sakura_canopy_back','sakura_trunk','sakura_canopy_mid','sakura_canopy_front'];
  for(let j=0;j<parts.length;j++){
   if(layerMode!==0&&layerMode!==j+1)continue;
   const part=parts[j],spec=DATA.metadata.assets[part],im=assets[part];
   ctx.drawImage(im,p.x-spec.anchor[0],p.y-spec.anchor[1]);
  }
  return;
 }
 const im=(texturesEnabled?assets:beforeAssets)[e.asset];ctx.drawImage(im,p.x-meta.anchor[0],p.y-meta.anchor[1]);
}"""
assert old in source
source=source.replace(old,new)
source=source.replace('let assets={},beforeAssets={},texturesEnabled=true,heroImages={}', 'let assets={},beforeAssets={},texturesEnabled=true,layerMode=0,heroImages={}')
source=source.replace("document.getElementById('texture').onclick=()=>{texturesEnabled=!texturesEnabled;document.getElementById('texture').textContent=texturesEnabled?'桜レイヤーON':'旧v7';document.getElementById('texture').setAttribute('aria-pressed',String(texturesEnabled));say(texturesEnabled?'v7：枝が見える樹木・自然な草地・崖面廃止':'v6：以前の樹冠・浮島状の地形');};",
"""document.getElementById('texture').onclick=()=>{
 texturesEnabled=!texturesEnabled;
 document.getElementById('texture').textContent=texturesEnabled?'桜レイヤーON':'旧v7';
 document.getElementById('texture').setAttribute('aria-pressed',String(texturesEnabled));
 say(texturesEnabled?'v8：3D幹と奥・中・手前の2D花レイヤー':'v7：花まで3D形状だった従来の桜');
};
const LAYER_LABELS=['全部表示','奥の花だけ','3D幹だけ','中間の花だけ','手前の花だけ'];
document.getElementById('layers').onclick=()=>{layerMode=(layerMode+1)%5;texturesEnabled=true;
 document.getElementById('texture').textContent='桜レイヤーON';
 document.getElementById('layers').textContent=layerMode?('層 '+layerMode+'/4'):'層を確認';
 say('桜：'+LAYER_LABELS[layerMode]+'（同一の足元原点で合成）');};""")
source=source.replace('textureEnabled,hero:', 'textureEnabled,layerMode,hero:') if False else source
source=source.replace('get:()=>({ready,texturesEnabled,hero:', 'get:()=>({ready,texturesEnabled,layerMode,hero:')
start=source.index('<div id="help"><div class="panel">')
end=source.index('</div></div>\n<script>',start)
source=source[:start]+'''<div id="help"><div class="panel"><h2>v8：桜1本だけを3D幹＋2D花の3層へ</h2><p><b>① 3D：幹・根・太枝</b>は実GLBから透明PNGへレンダリング。根元のX/Z座標と当たり判定半径0.26mは変えていません。</p><p><b>② 2D：花は3枚</b>。奥の桜花→3D幹→中間の桜花→手前の桜花を、共通アンカーで重ねています。花の描画は決定的なPillow描画で、画像生成の完成予想図ではありません。</p><p><b>③ 歩行</b>は以前と同じCanvas2Dエンジン。木全体を足元の奥行き順でソートし、緋月との前後関係を維持。葉と花に当たり判定はありません。</p><p><b>比較</b>：「桜レイヤーON／旧v7」で同じ景色を切り替え。「層を確認」で奥葉・3D幹・中葉・前葉を1枚ずつ見られます。カメラ40°／方位35°固定、家・橋・川・他の木・緋月の動きは変更していません。</p><p>※ 桜1本だけの技術・美術試作であり、全樹木への採用は未承認。iPhone Safari実機は別途確認が必要です。</p><button id="closeHelp">戻る</button>'''+source[end:]
source=source.replace('この風景は制作スクリプトで再生成できる3D→2Dデモです。','')
source=source.replace("say('3Dから出力したPNGで描画中。道のタップ／スティックで移動できます。')", "say('桜：3D幹＋2D花3層のデモ。上部で旧v7・各層を比較できます。')")
source=source.replace('<title>鬼哭の花契り｜斜め視点 3D→2D 桜の2Dレイヤー化 v8</title>', '<title>鬼哭の花契り｜桜3D幹＋2D花3層 v8</title>')
assert 'id="layers"' in source and 'sakura_canopy_back' in source

def pack(path,kind=None):
    kind=kind or ('webp' if path.suffix=='.webp' else 'png')
    return 'data:image/'+kind+';base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
images={p.stem:pack(p) for p in sorted((ROOT/'assets').glob('*.png')) if p.stem not in ('ground','texture-atlas')}
images['ground']=pack(ROOT/'assets/ground-q90.webp')
meta=json.loads((ROOT/'assets/render-metadata.json').read_text())
before={n:pack(ROOT/'baseline'/(n+'.png')) for n in ('house','teahouse','bridge','fence','tree','sakura','rock','shrub','lantern','flowerpatch')}
before['ground']=pack(ROOT/'baseline/ground-q90.webp')
oldmeta=json.loads((ROOT/'baseline/render-metadata.json').read_text())
source=source.replace('__HERO_IMAGES__','{}')
source=source.replace('__DATA__',json.dumps({'images':images,'metadata':meta},ensure_ascii=False,separators=(',',':')))
source=source.replace('__BEFORE_DATA__',json.dumps({'images':before,'metadata':oldmeta},ensure_ascii=False,separators=(',',':')))
assert '__DATA__' not in source and '__BEFORE_DATA__' not in source
out=ROOT/'hanachigiri_3d2d_sakura_layers_v8.html'
out.write_text(source,encoding='utf-8')
print('built',out,out.stat().st_size)