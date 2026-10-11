# 旧リポジトリから移行したシナリオ関連資料

移行元: [HiHoSir/yaksha-hanamusubi](https://github.com/HiHoSir/yaksha-hanamusubi)  
移行日: 2026-10-11  
目的: 『鬼哭の花契り』開発時の物語・設定・章構造の参照用バックアップ。

## シナリオ・物語設定

- [シナリオバイブル](docs/production-bible/SCENARIO_BIBLE.md)
- [イベント設計ルール](docs/production-bible/EVENT_DESIGN_RULES.md)
- [世界観バイブル](docs/production-bible/WORLD_BIBLE.md)
- [キャラクターバイブル](docs/production-bible/CHARACTER_BIBLE.md)

## 章構成・地理と進行

- [章・世界地図計画 v0.3](docs/world/chapter-world-plan-v0.3.md)
- [章間ゲート計画 v0.8](docs/world/chapter-gateways-v0.8.md)
- [新大陸配置案 v0.7](docs/world/new-continent-east-sea-v0.7.md)

## 取り扱い上の注意

- 移行元の原文を保管した資料であり、現行の新しいゲーム実装と完全に整合していることを意味しません。
- 文中の `js/data.js`、`js/world.js` などは**移行元の参照先**です。新リポジトリに実装されたことを示すものではありません。
- 各資料の「確定」「実装」「提案」「未決」「仮」は**移行元時点の状態**です。新リポジトリの正本設定に自動昇格させません。
- ROM由来の画像、音声、タイル、正確な地形データはこの移行に含まれません。
- 実行時のシナリオコード `js/data.js` は今回コピーしていません。必要な物語イベントを新しいエンジン向けに実装する際に別途参照してください。
