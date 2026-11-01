# 制作スキル

## シルエット優先・ドット絵化 v2.1

- 入口: [SKILL.md](silhouette-first-pixel-art/SKILL.md)
- 使い方: [README](silhouette-first-pixel-art/README.md)、[制作手順](silhouette-first-pixel-art/docs/PROCEDURE.md)
- 変更点: [v2.1変更履歴](silhouette-first-pixel-art/docs/V2_1_CHANGELOG.md)
- 保護領域: [ガード付き部位修正](silhouette-first-pixel-art/docs/SEMANTIC_EDIT_GUARDS.md)
- 複数方向: [照合手順](silhouette-first-pixel-art/docs/MULTIVIEW_PROTOCOL.md)

保存元は `generic_silhouette_pixel_skill_v2_1.zip`（内部版2.1.0、作成日2026-10-30）。2026-11-02に原本29ファイルをバイト変更なしで収録。

元ZIPのSHA-256: `8bf3f5e4b9aab82dcc90689d61a100cd6657fd1bce76a02bb286dfcac37964f3`。
同梱 `MANIFEST.sha256.json` の28件を照合し、原本との差がないことを確認。

### 検査

レポジトリルートから:

```bash
cd skills/silhouette-first-pixel-art
python3 scripts/test_pipeline.py
python3 scripts/test_semantic_quality.py
```

PillowとNumPyが必要。両テストは収録時に通過。テストはデータ整合・保護規則の検査であり、画像の美術品質や歩行の自然さの承認ではない。

### 花契りで使用するとき

入力は利用者が指定した現行の緋月原画・3Dレンダーを使い、版、方向、カメラ、目的寸法、足元基準を作品別に記録する。同梱の64×96サンプルや過去の緋月事例は、現行アセットの外見・寸法・承認状態の正本ではない。

このフォルダは制作道具の保存場所。既存ゲームへ自動適用する処理や、ChatGPT個人スキルへのインストールは行わない。

## 歩行アセットの監査

- [hizuki-walk-audit](hizuki-walk-audit/SKILL.md)：既存の左右関節・ポーズ検査用。参照画像に関する古い指定は、利用者の最新指定と現行の実アセットを照合して読む。
