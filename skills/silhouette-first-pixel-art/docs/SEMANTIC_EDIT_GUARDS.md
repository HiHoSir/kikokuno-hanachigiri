# 部位指定・保護領域を伴う画素パッチ (v2.1)

## 仕様

以前のv2では `inspect --protect-bottom` が**差分を数えるだけ**だった。v2.1では `generic-pixel-guard-v1` とパッチの `viewId` / `partId` を照合して、許可範囲外の変更を **PNG保存より前に拒否**する。

- ガードには `width` / `height` と各 `views` の `editable_parts`、 `protected` を明示する。
- `editable_parts` は編集を**許す**範囲、`protected` は強制的に編集を**拒否**する範囲。重複すると`protected`が優先。
- `rect` は左上含む、右下含まない。`polygon` は頂点座標を含む。 `mask` は、RGBA PNGのalpha>0 またはグレースケール画像の非0を許可/保護領域とする。
- ガード適用時には方向IDと部位IDをコマンド引数とパッチ双方に必須とする。元RGBAのSHA256一致も必須。
- 編集対象となる透明ピクセルは原則編集しない。`--allow-alpha-change` は、透明ピクセル変更の禁止を解除しない。輪郭/透明度を変える工程は独立の作業として別レビューする。
- 変更前後PNG、差分JSONは残し、検査違反時は出力PNGを作らない。

## コマンド

```bash
# 64×96のfrontコマを例示。編集PNGはエディタ等で手動作成する。
python scripts/pixel_pipeline.py make-patch before.png after.png patch.json --view front --part hair
python scripts/semantic_quality.py guard-check before.png after.png examples/edit-guard-example.json --view front --part hair
python scripts/pixel_pipeline.py apply before.png patch.json replayed.png --view front --part hair --guard examples/edit-guard-example.json
```

`examples/edit-guard-example.json` の保護領域や部位座標は**説明のためのサンプル**。別のキャラへ使うときは必ず自分の画像で描いて検証する。

## 設計上の限界

「髪だから自動的に髪だけ編集していい」は判定しない。**領域注釈は人間/AIによる意味付けが必要**。パレット値だけで顔や髪を識別しない。検査は間違った注釈自体の正しさを保証しない。
