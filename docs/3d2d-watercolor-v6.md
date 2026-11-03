# 鬼哭の花契り｜3D→2D淡彩マテリアル試験 v6

## 位置づけ
v5の斜め視点・3D→2D方式を維持し、**3Dを複雑化するのではなく材質・色面で淡彩寄りにする**独立デモ。マップ領域は拡張せず、本編 `index.html`、`maps/village/map.json`、緋月V35の原本と承認済みパラメータは未変更。画質は試験段階であり美術承認を意味しない。

## 実装
- 制作: 既存の手続き的な3Dメッシュ、GLB、7種のUVテクスチャ（瓦、漆喰、木材、石、樹皮、橋床材など）。Pillow/NumPyの決定的な色調整と低周波の顔料むら。
- 俯角40°、水平方位35°、平行投影。家・茶屋・木・桜・岩・橋等を共通カメラから独立したRGBA PNGへレンダリング。
- 屋根瓦の濃淡を抑え、漆喰を明るくし、樹冠の小面の彩度差を軽減。地面は同じ3D平面投影とアルファ輪郭のまま淡い色むらを追加。
- v5で修正した木目のUV方向と板の3D目地を継承し、部材の位置・衝突領域・3D三角形総数を増やさない。
- Canvas2Dの実行時描画を維持。『淡彩ON／旧v5』で**同じ歩行・カメラ・配置のまま**画像を切り替える。
- 実行時にGLB/WebGLは使用しない。デモHTMLへ歩行・走行・停止の既存緋月V35 PNGをそのまま埋め込んだ。元素材は変更していない。

## デモ
`demo-3d2d-watercolor-v6.html`

Pages URL: https://hihosir.github.io/kikokuno-hanachigiri/demo-3d2d-watercolor-v6.html

v5: `demo-3d2d-woodgrain-v5.html`（残存）。

## 品質検査
- GLB/テクスチャ、描画PNGの実ファイルを出力済み。
- camera / projection / image size / anchor / 三角形総数の一致、地面RGBAアルファの一致：PASS。
- v5→v6の材質・樹冠・地面のRGB差：PASS。木目UVの長軸方針は変更なし。
- Chromium 980×740、390×844: 投影逆投影、衝突、橋の経路、タップ移動、表示切替、JavaScript例外なし：PASS。
- **未確認**：GitHub Pagesの配信完了・iPhone Safari実機動作・iPhoneでの画質承認。ネットワーク遮断のChromium検査は緋月の仮マーカーを使用。HTML内の実V35画像埋込はデータ形式を検査したが実機再生は未検査。

## 保存・再現
原本・比較画像・PNG・GLB・UVアトラス・`source/build_assets.py`・`source/build_textured.py`・`source/build_watercolor.py`・テストを含むv6成果物ZIPを会話内に保存。マップ制作スキル `skills/build-layered-rpg-maps/SKILL.md` と `docs/MAP_ART_RULES.md` に従い、手前奥、足元、通行はRGBAのシルエットとは分離して判断。

## 未解決
樹冠の硬い面分割、背景のジオラマ感、地面の立体感、緋月の2Dスプライトと背景の線・陰影の一致。**今回の柔らかい色調整だけで『淡彩水墨画の完成』とは扱わない**。次の美術改善は比較デモを使い、材質と輪郭を順に調整する。
