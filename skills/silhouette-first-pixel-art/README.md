# 汎用シルエット優先・ピクセルアート制作キット v2.1

このレポジトリでは制作手順拡張v2.1.1として、[丸い部位の1px角落とし](docs/CORNER_TRIMMING.md)を追加している。通常のalpha固定修正と分け、対象座標を限定した別候補・ガード付きパッチで検証する。実行スクリプトはv2.1のまま。

**対象**：承認済み透明原画から作る任意サイズのキャラクター、NPC、単独オブジェクトのドット絵。**目的**：原画に沿った外形を安定して取ったあと、色や細部を実ドットでブラッシュアップする。特定ゲームの固有名詞、髪色、解像度、8方向歩行をコアに組み込まない。

v2.1.2では [ジグザグ陰影](docs/ZIGZAG_SHADING.md) と [今回の緋月の再現セット](../../experiments/pixel-zigzag-v1/README.md) を追加。通常版からの厳密再適用と、具体的な作画レシピを区別して保存している。

## すぐ試す
```bash
python -m pip install -r requirements.txt
python scripts/test_pipeline.py
python scripts/pixel_pipeline.py draft examples/synthetic_reference.png ./work/sample.png --width 64 --height 96 --palette examples/sample_palette.json --outline '#253048'
```

`sample.png` は**自動下書き**。作品として完成した絵ではありません。`sample-mask.png` は二値輪郭、`sample-report.json` は出典・サイズ・色ガイドの検査情報です。

自分の原画へ使うときは `examples/synthetic_reference.png` を承認済み透過PNGに交換し、目標幅・高さ・パレットを変更します。例えばNPCの32×32版は `--width 32 --height 32`、縦長歩行の80×120版は `--width 80 --height 120` と指定。**単純に縮小して仕上げとはしません**。輪郭を土台に色面をドット単位で描き直してから納品します。

## 手で編集した後の厳密な差分
```bash
python scripts/pixel_pipeline.py inspect work/sample.png work/edited.png --protect-bottom 8
python scripts/pixel_pipeline.py make-patch work/sample.png work/edited.png work/diff.json
python scripts/pixel_pipeline.py apply work/sample.png work/diff.json work/replayed.png
```
`apply` は、RGBA生バイトSHA256・編集前画素・範囲・重複・alphaロックを検査し、適用して初めて新PNGを作ります。`inspect` は数値を表示するだけなので、保護領域の違反が0かはレビュー側で判定します。

## 複数方向のアトラス
`examples/views-example.json` をコピーし、自分のPNG名・方向ID・並び順へ変更する。
```bash
python scripts/pixel_pipeline.py atlas work/views.json work/atlas.png
```
方向・コマは任意。アトラスへの配置とアニメーション生成は別問題です。鏡像の利用はデザインの左右対称性が確認できた場合のみ。

## v2.1：複数方向検査とガード付き部位描き込み

```bash
python scripts/test_semantic_quality.py
python scripts/semantic_quality.py audit examples/multiview-example.json --output ./work/multiview.json
```

この検査は複数方向の総色数・共通色数・登録した材質ごとの色、明示したランドマークと装飾の注釈を照合します。**装飾・手足・視線の正しさを画像から自動認識するものではありません。**色の共通数を最大化する必要もありません。

ガード付きの画素修正（`before.png`/`after.png` は利用者が用意した同じサイズのRGBA画像）：

```bash
python scripts/pixel_pipeline.py make-patch before.png after.png patch.json --view front --part hair
python scripts/semantic_quality.py guard-check before.png after.png project-guard.json --view front --part hair
python scripts/pixel_pipeline.py apply before.png patch.json checked.png --guard project-guard.json --view front --part hair
```

`examples/edit-guard-example.json` を自分の人物のマスクに合わせて変更する。編集可能パーツから外れた部分・保護マスク・別方向・別パーツのパッチは拒否します。ガードなしの元コマンドはv2互換です。

詳細は `docs/SEMANTIC_EDIT_GUARDS.md`、`docs/MULTIVIEW_PROTOCOL.md`、`docs/V2_1_CHANGELOG.md`。

## 役割の分離
1. **汎用技術**：`scripts/pixel_pipeline.py` と検査 `test_pipeline.py`。
2. **制作手順・ゲート**：`SKILL.md` と `docs/`。
3. **作品別設定・承認原画・差分・履歴**：個別プロジェクトに保管。緋月の旧再現キットは `docs/HIZUKI_CASE_STUDY.md` に経緯のみ記載し、汎用コードへ混ぜない。

## 動作環境
Python 3.10以降、PillowとNumPy。ネットワーク/APIは不要（初回のライブラリ導入を除く）。PNG出力は透過RGBA。CLIは変更しない入力PNGを読み込んで別の出力を作ります。既存ゲームアセット・GitHubへの書き込みはしません。
