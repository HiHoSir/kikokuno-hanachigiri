# 鬼哭の花契り — 桜の根張り改善 v10

## 対象

`HiHoSir/kikokuno-hanachigiri` の独立した3D→2Dマップデモ。v9の実装を継承し、**桜1本の根元だけ**改良。まだ本編マップの採用変更ではない。

## 実装

- 共通カメラ：平行投影・俯角40°・水平方位35°。
- 桜の設置：`x=10.9,z=7.2`。幹の衝突半径`0.26m`、世界座標、出現位置・橋・川・移動のロジックを維持。
- 根元は短い円柱状の棒の寄せ集めから、**根元で膨らむ3D幹**と**地表に沿う6方向の非対称で湾曲した根**に変更。根の大半は浅く地面に埋もれる低い装飾で、衝突多角形は変更しない。
- 既存の枝・花房位置を維持し、花の「奥・中・手前」の3枚の2D画像はv8/v9と同じ画素を使用。追加した透明2D画像は`root_ground`（土・薄い苔）と`root_details`（草先・苔・落花）。
- 木の画像はすべて足元基準`anchor=[260,455]`。新規描画は520×527pxで、過去520×495pxの花を**内容を変えずに透明部分だけ延長**。根先のトリミングを避けた。
- 描画順：後ろ花→根元の地面馴染み→3D幹・根→根元の細部→中間花→前花。従来v9との切替では、花だけは共通のまま根元だけを切り替える。
- テクスチャ付きGLB `assets/sakura_trunk.glb` を、専用ソフトウェアZバッファ描画で `sakura_trunk.png` に変換。
- デモの本編共通描画は `src/map/renderer.js` の `loadCharacter()`、`src/map/motion.js` の `MotionPlayer`、`src/map/character-visual.js` の `drawCharacterFrame()` を**直接import**。旧モーション素材はHTMLへ再埋込しない。
- UIに「桜の根元」拡大表示と「根張り改善ON／旧v9」比較を追加。元の層ごと表示・移動・スティック操作は維持。

## 検査

- `source/test_sakura_roots_v10.py`: テクスチャGLB、全RGBA、アンカー、6層の画素合成、上部花の不変、切り抜きなし、共通キャラ処理参照 → PASS。
- `source/make_html_v10.py`: 旧v9と新v10で本編用アニメの**別コピーを持たない**公開HTMLを生成。
- オフラインPlaywright（Chromium）：1100×760、390×844。起動、モーション制御（本編実装のJS使用）、新旧比較、根元拡大、花レイヤー、橋・川・幹の判定、UI操作、JS例外なし → PASS。
- **ただしオフライン検査の緋月画像はテスト用の仮PNG。実V35の姿・表示品質が合格したという意味ではない。** 本番版では`character.json`をGitHub Pagesから取得する方式を保持。
- ブラウザのローカルHTTP移動は環境ポリシーで遮断された。`page.set_content()`を使用したネットワーク不要の試験。Pagesからの実配信、iPhone Safari実機は未確認。

## 再生成

Python + Pillow、NumPy、trimesh、numba。従来の `build_assets.py`,`build_textured.py`,`build_watercolor.py`,`build_landscape.py` は同梱。元v9のデモHTMLは配布ZIPの `baseline/v9-demo.html` に同梱。再生成用のPython一式とGLB/PNGは本会話のZIP成果物に含む。GitHubのこのREADMEは仕様と検査記録であり、`source/`のコードがリポジトリに配置済みという意味ではない。

```bash
cd <ZIPを展開したディレクトリ>/hanachigiri_sakura_roots_v10/source
python build_textured.py            # 共通atlasおよびモデル素材（初回のみ）
python build_sakura_layers.py       # 桜の3D幹・根と2D花/足元レイヤー
python make_html_v10.py            # 本編のv9デモからv10版を出力
python test_sakura_roots_v10.py    # アセット整合・GLB/PNG/レイヤー検査
```

`make_html_v10.py`はZIP展開ディレクトリ直下へ `hanachigiri_sakura_root_v10.html` を出力する。これを `demo-3d2d-sakura-roots-v10.html` へ配置すればGitHub Pages用デモとなる。現状のv9の画像をインラインに含んだHTMLから新規根だけを差し替えているため、変更しない景物は同じまま。

`old/`の旧実装は使用していない。最終採用時には根が重なったときの緋月の見え方、現行V35との縮尺、iPhone Safariでの操作を再確認する。