# 鬼哭の花契り｜斜め視点 3D→2D 景観改良デモ（2026-11-03）

**位置づけ**：操作可能な独立した技術デモ。現行ゲーム本編マップと緋月V35の正本は変更しない。参考の淡彩イラストに完全一致した完成版ではない。

## 今回のブラッシュアップ

- カメラは**俯角40°・方位35°**の平行投影を維持。実際にGLBを作成してから同じ三角ポリゴンを深度バッファ付きソフトウェアレンダラーでRGBAへ変換。
- 独立した3Dモデルは10種類（家、茶屋、樹木、桜、橋、灯籠、岩、低木、柵、草花）。家は屋根瓦・木組・障子・縁側・石段・入口、茶屋は色・寸法・看板を差別化。
- 地面は3Dの水平面として斜め投影し、岩肌の崖面と川の水面、草地、石畳、花びら、河岸の石を制作。上下に動く水光と舞う花びらはCanvas2Dの軽量エフェクト。
- 見かけ寸法は現行V35の縮尺との比較で家・木・小物を調整。物理判定を画像アルファから取得しない。
- 操作可能なデモHTML内に背景・景物のPNGを内包。緋月V35の画像は公開ページへの通信で読み込む構成。GitHubの公開デモ版には、現行V35正本の歩行・走行・倒れる（仮待機）3画像をHTMLに直接埋め込んだため、追加のスプライト通信は不要です（元画像は変更していません）。配布ZIP内の生成HTMLはオンライン時に正本を読み込む軽量生成版です。
- 前回同様、タップ移動／スティック・矢印キー／歩行・走行／全景／当たり判定の可視化を維持。橋の上だけが通れる。家2軒と木幹、柵は接触不可。

## 含まれるデータ

- `hanachigiri_3d2d_demo.html`：再生・操作用の単一HTML
- `assets/*.glb`：再生成できる正本3Dメッシュ
- `assets/*.png`：独立したRGBAレイヤーと地面
- `assets/render-metadata.json`：投影条件、各モデルの画像寸法・足元アンカー
- `source/build_assets.py`：3Dモデリング／深度付き2Dレンダリング、地面と水辺の制作
- `source/make_html.py`：配布HTML生成
- `source/test_oblique.py`：PC・iPhone相当のChromiumで表示・投影・当たり判定を検査
- `source/check_assets.py`：10種類のGLB・RGBA・投影とアンカーの検査

## 再生成

Python3 + `Pillow` / `numpy` / `trimesh` / `numba` が必要です。操作画面検査にはPlaywright + Chromiumを使います。

```bash
python source/build_assets.py
python source/check_assets.py
python -c "from PIL import Image; Image.open('assets/ground.png').save('assets/ground-q90.webp',quality=87,method=6)"
python source/make_html.py
python source/test_oblique.py
```

## デモの制限

- 3Dを制作した後、実際の操作は**Canvas2Dのみ**。ゲーム中にGLBやWebGLで描画していない。
- 家屋の室内、NPC会話、セーブ、本編シーン間遷移、複数階の3D歩行は未実装。
- 美術品質は**試作より改善した段階**で、最終目標の淡彩画・筆描き風にはなお造形・テクスチャ・植栽の調整が必要。
- ChromiumのPC／iPhone相当のビューサイズで検査済み。**iPhone実機Safariは未検証。**
- ローカル検査は緋月スプライトの外部通信を遮断したため、プレビューのキャラは「仮」のマーカー。GitHubの公開HTMLは正規V35画像を内包する。