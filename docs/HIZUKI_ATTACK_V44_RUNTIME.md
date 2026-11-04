# 刀攻撃 v44 のゲーム実装（2026-11-05）

## 採用決定

利用者が 2026-11-05 に刀攻撃 v44 を採用するよう明示。前段では v42 暫定採用、v43c 接地・刀先速度調整、v44 右脚のロール最小補正。最新版の採用指定を優先して、ゲームの **刀攻撃だけ** 更新。

## 実装契約

- 入力 3D ソース：`Hizuki_V44_ThighShinRollBalanced_v43c_Footplanted_Trial.glb` (SHA256 `f50236f3f065b38e8ce776b8494f6922cce17f2040b904766047c7b878f8ccb6`)
- 出力 2D：`assets/characters/hizuki/v35-expanded-cells/attack_katana_v44_8dir.png`
- 8方向は front/front_right/right/back_right/back/back_left/left/front_left。各8フレーム、1.10秒、一回のみ再生。
- 40°平行投影、原テクスチャ・カメラ追従ライト、全色RGBA。30色減色、ドット絵化、左右反転、フレーム別トリミングなし。
- 共通セル224×256、ランタイム足元アンカー `base [43.6993006993007,97.52129729729731] + padding [68,112]`、表示倍率0.85を維持。
- フレームは元モーション1.10秒を8等分した時刻で抽出。`smooth:true`。既存の歩行・走行・待機・脇差ほかを変更しない。
- 旧 `attack_katana_8dir.png` はロールバック用に保持。新規版名のPNGへ台帳を切り替え、iPhone Safariのキャッシュ混在を避ける。

## 自動検査

- 64セル全てアルファ領域あり、全セルの画像端に接触する可視画素がない。
- 画像サイズ 1792×2048 = (8×224)×(8×256)。画像SHA256は `atlas_qa.json` に記録。
- 他の8動作の台帳を保持。`npm test` / `npm run build` / PagesブラウザQAで再確認。

## 留保

- 3Dアセット自体は約63MBのためこのPages版には含めず、ゲームは上記のスプライトを読む。3Dの再出力には承認済みGLBを別途用意する。
- ユーザー実機 iPhone Safariでの見た目は未検証。クラウドブラウザQAと区別する。
- 参考画像のスキニング・指の握り・床沈み込みなどの残課題は受容した採用状態を維持し、勝手にボーンを再修正しない。

## 再現手順

Python に `numpy`, `scipy`, `Pillow`, `vtk` を入れ、環境変数 `HIZUKI_V44_GLB` に元GLBのパスを渡して `python tools/hizuki-attack-v44/render_atlas.py` を実行。生成された `attack_katana_v44_8dir.png` と `atlas_qa.json` を品質検査し、ゲームのアセットへ反映する。