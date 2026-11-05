# 『鬼哭の花契り』刀攻撃v44：待機・歩行・走行へのライティング整合（2026-11-05）

## 原因

刀攻撃は旧・採用済み3動作と同じ「40°平行投影・カメラに追従する2光源」という基本構成でも、実際の髪と赤い衣装の画素平均が暗かった。前回の検査は光源座標や強度の説明をもって見た目まで一致したと誤認していた。

## 方針

承認済み刀モーションv44のGLB・姿勢・速度・踏み込み、8方向対応、出力倍率60px/m、224×256セル、元の基準足元は変更しない。**光源・マテリアルの照明成分のみ**を変更して再レンダリングする。テクスチャ書換、ドット絵化、コマ別トリミング、RGB後補正は使用しない。

- source: `Hizuki_V44_ThighShinRollBalanced_v43c_Footplanted_Trial.glb` SHA256 `f50236f3f065b38e8ce776b8494f6922cce17f2040b904766047c7b878f8ccb6`
- output: `attack_katana_v44_lightmatched_8dir.png` SHA256 `a5fb017fb84214e2cb34e374f7c8cc7692acd057a2d2424abccce1dab9a89f24`
- camera: ortho elevation 40°, yaw `[0,-45,-90,-135,180,135,90,45]`, lights track camera
- source 60px/m; 8 directions × 8 frames; 1.10 seconds; one-shot

### 照明変更

|項目|従来|修正|
|---|---:|---:|
|key intensity|0.80|0.97|
|fill intensity|0.42|0.50|
|material ambient|0.52|0.65|
|material diffuse|0.48|0.42|
|body specular|0.05|0.05（維持）|

### CI計測値との照合

基準: 現行GitHub Pagesで採用中の待機・歩行・走行の4方向（front/front_right/right/back）各frame 0の髪（top45-blue）と赤い衣装（upper55-red）の輝度平均。

- 青い髪の平均絶対誤差：20.81 → **1.49**
- 赤い衣装の平均絶対誤差：9.56 → **2.09**
- 8方向×8コマのアルファチャンネルは旧・修正で**完全一致（変更画素0）**。
- すべての64セルが非空、画像端欠け0、既存のv44向き・倍率・足元アンカー・GLBアニメーションと他8動作を変更なし。
- 補足: これらは領域色の統計的近似であり、ポーズによって反射面が異なるためピクセル単位の一致は保証しない。iPhone Safari実機での最終評価は別途必要。

## 再現

Pythonの `vtk`, `numpy`, `scipy`, `Pillow` が必要。スクリプト `tools/hizuki-attack-v44/render_atlas_lighting_matched.py` を利用し、環境変数 `HIZUKI_V44_GLB` を上記GLBのパスに指定して実行する。

既存の `attack_katana_v44_corrected_8dir.png` と初回誤公開 `attack_katana_v44_8dir.png` は履歴・比較用として残す。現行ランタイムは `attack_katana_v44_lightmatched_8dir.png` を参照する。