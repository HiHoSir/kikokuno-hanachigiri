# 現行情報と隔離資料

利用者の2026-11-02指示により、旧実装・素材・実験・モデル・旧配信設定は `old/pre-layered-map-2026-11-02/` に隔離した。現行は `src/map/`・`maps/village/`・`assets/characters/hizuki-v35/`。旧情報の中に「確定」「承認」「実装済み」とあっても現在の採用を意味しない。

- 制作規則：AGENTS、MAP_ART_RULES、MAP_ASSET_CONTRACT、ASSET_POLICY。
- 実装の正本：CURRENT_ARCHITECTURE、PLAYABLE_MAP_WORKFLOW、現行データとコード。
- スキル：汎用レイヤーマップ、シルエット優先ピクセル化、既存の歩行監査。
- 緋月：通常版80×112px・30色・角落としあり。ジグザグ版は不採用比較として隔離。

隔離確認は `old/README.md` と `old/ARCHIVE_MANIFEST.json` を使う。過去コードを自動探索・参照しない。再利用は明示的に依頼された範囲で出典と適合を再確認する。
