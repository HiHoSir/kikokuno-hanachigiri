---
name: silhouette-first-pixel-art
summary: Create editable pixel-art drafts from approved transparent artwork using nearest-neighbor binary silhouettes, independent palette guidance, and audited coordinate-level retouching. Works across character designs, directions, poses, and target dimensions.
version: 2.1.2
---

# 承認原画 → シルエット優先 → 実ドット修正（汎用スキル）

## 使用対象
透明背景の**承認済み原画**を元に、キャラクター・NPC・装備・オブジェクトなどのピクセルアートを試作／修正／再現するときに使う。静止・複数方向・コマ別のいずれも可。**64×96、8方向、緋月の衣装は前提ではない。** タイルのオート接続や歩行アニメ生成は別工程であり、このスキルだけでは保証しない。

## 守る順序
1. **入力の確定**：正しい原画・向き・ポーズ・承認状況・画像サイズ・透過状態・目的サイズ・許容変更領域を確認。原画を上書きしない。
2. **形の確定**：alpha しきい値でマスクを二値化、人物外接矩形を計算。マスク**だけ**を Nearest で目標キャンバスに収める。縦横比・足元余白を保つ。輪郭はプレビューと比較で承認する。
3. **色面の仮配置**：原画を色位置の**参照ガイド**として利用し、作品に合った共通パレットを用意する。自動色割り当ては**未完成の下書き**。完成絵を単純Nearest縮小して納品しない。作画意図に応じ人間/AIが色面を画素で描き直す。
4. **1px編集**：髪・顔・衣装などの意味的な境界を決め、対象領域を限定して x/y 座標とRGBAで補修。顔・目・指・装飾の保護領域を設ける。**ガード付き適用時には範囲外・保護領域への変更を保存前に拒否する**。反復ノイズ除去で目や模様を壊さない。
   - **丸い部位の角落とし（任意）**：髪・頬・肩など、丸く見せたい輪郭の直角が目立つ場合は [角落とし手順](docs/CORNER_TRIMMING.md) を使う。`┓` 等の外側の角1pxを選んで落とし、斜めのつながりへ整える。全ての角を自動削除しない。外周の削除は別候補でのみalpha変更を許可し、対象座標のガード・差分再適用・削除数照合後に通常のalphaロックへ戻す。色面内部の角は透明化せず周囲の材質色で整える。
   - **ジグザグ陰影（任意）**：髪束や布の折れ目の明暗境界を1〜2px単位で食い込ませたい場合は [ジグザグ陰影](docs/ZIGZAG_SHADING.md) を使う。通常版から別候補へ分岐し、alpha・保護部・パレットを固定する。陰影の面積も変えた場合は境界形だけの比較と区別する。具体例の入力・パッチ・再現コマンドは [緋月の実験セット](../../old/pre-layered-map-2026-11-02/experiments/pixel-zigzag-v1/README.md) にある。
5. **方向・材質の照合**：複数方向では同じ材質の色を比較するが、共通色数の最大化を目標にしない。手の甲/手のひら、前後の重なり、装飾の方向性は**視覚的に検査**する。方向や部位は宣言したラベルに従い、AIに自動推定したと偽らせない。
6. **差分と検証**：元RGBAハッシュ・変更前画素・変更後画素を記録。パッチを元データに再適用し、全RGBA一致を検証。通常はalpha差分0、独立した角落としでは事前に選んだ削除座標だけに一致することを確認。保護領域、足元、方向/フレームの一致も確認。
7. **目視検査と承認**：元原画／前／後を実寸・整数倍で比較。美術品質の承認はテスト通過と別。承認なしに本編へ反映しない。

## 最小コマンド
```bash
python -m pip install -r requirements.txt
python scripts/test_pipeline.py
python scripts/pixel_pipeline.py draft examples/synthetic_reference.png ./work/draft.png --width 64 --height 96 --margin-bottom 1 --palette examples/sample_palette.json --outline '#253048'
python scripts/pixel_pipeline.py inspect ./work/draft.png ./work/edited.png --protect-bottom 16
python scripts/pixel_pipeline.py make-patch ./work/draft.png ./work/edited.png ./work/change.json
python scripts/pixel_pipeline.py apply ./work/draft.png ./work/change.json ./work/replayed.png
```
v2.1追加機能：
```bash
python scripts/test_semantic_quality.py
python scripts/semantic_quality.py audit examples/multiview-example.json --output ./work/audit.json
python scripts/pixel_pipeline.py make-patch before.png after.png patch.json --view front --part hair
python scripts/pixel_pipeline.py apply before.png patch.json replayed.png --guard examples/edit-guard-example.json --view front --part hair
```
`--guard` を省略すると従来のv2互換で動くため、**部位保護が必要なら必ず付ける**。ガード内の部位範囲・保護領域は作品ごとに書き直すこと。

`./work/edited.png` は**ドットエディタで実際に手修正した画像**を指す。コマンドだけでは作画品質は上がらない。作成前に `README.md` と `docs/PROCEDURE.md` を読む。

## 一般化の要点
- `--width`, `--height` は任意（4〜2048）。モジュール側で64×96に固定しない。
- 色パレットは入力作品ごとに指定。自動提案色は仮置きで、採用を意味しない。
- 方向数・名称・並べ方は `views.json` のリストで指定。固定の8方向を強制しない。
- 保護領域はプロジェクトごとに決める。アルファ・左右対称・足元・手の向きなどは**作品ごとの制約**として記録する。
- 修正パッチは原画像SHA・変更前RGBAを必須とし、古い版／異なるポーズへの誤適用を拒否する。
- 新しい画像生成は**修正工程ではデフォルトで使わない**。必要な場合は別プロセスとして原画を再承認してから扱う。

## 検査・限界
- 合格対象：機械的なデータ整合性、保存・再適用、RGBAアルファ保護、異常入力拒否。
- 未保証：デザインの忠実度、歩行アニメの自然さ、キャラ同一性の美術的判断、背景透過に見えるだけの不透明画像からの正しい分離。
- 色面の初期案は原画ガイドからの**面積平均＋パレット近似**であり、「全画素を手打ち」したものではない。
- Alpha>0 の曇り・影・グローを含む入力はマスクが膨らむ。人物マスクを手動で直すか元原画を清書する。

## v2.1追加の品質ゲート
- 作品・部位ごとに `editable_parts` と `protected` のポリゴン/矩形/マスクを設定する（ガード必須の工程はCLIで `--guard` を省略しない）。
- `viewId`・`partId` は適用時に必須検証し、誤った方向/パーツへの適用を拒否する。
- 複数方向の色数・材質ごとのパレットは**診断**。色をそろえるだけで作品品質が上がると見なさない。
- 手/腕の裏表・装飾の可視関係は参照原画と照合する。確認不能なら「未検証」とする。

## 資料
レポジトリ拡張v2.1.1：[丸い部位の1px角落とし](docs/CORNER_TRIMMING.md)。v2.1の既存パッチ機能を利用する制作手順であり、自動角削除フィルターの追加ではない。

`README.md`、`docs/PROCEDURE.md`、`docs/QUALITY_GATES.md`、`docs/PROFILES.md`、`docs/FAILURE_MODES.md`、`docs/HANDOFF_PROMPT.md`、`docs/HIZUKI_CASE_STUDY.md`、`docs/MULTIVIEW_PROTOCOL.md`、`docs/SEMANTIC_EDIT_GUARDS.md`、`docs/V2_1_CHANGELOG.md`。
