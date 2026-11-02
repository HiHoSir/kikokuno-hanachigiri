# 鬼哭の花契り — 淡彩レイヤーマップ基盤

独立した地面・家・木・橋と、足元基準・歩行面・当たり判定を組み合わせる新しい屋外マップ試作。旧実装は `old/` に隔離した。

## 遊ぶ・配置する

- 道をタップして経路移動。左下スティック、矢印／WASDでも移動できる。
- 川は歩行不可、橋の床だけで対岸へ渡れる。木の幹と家にはぶつかり、木の前後で遮蔽が変わる。
- 「全景」で全体を確認。「配置・検査」で景物のX/Z位置、歩行面・判定・足元を確認できる。
- 配置を端末に保存し、マップJSONの保存／読み込みで別環境へ引き継げる。
- キャラは採用した通常版緋月の静止1枚を仮表示。方向別歩行素材・室内・次のマップは未制作。iPhone Safari実機検査は別途必要。

## 現行の正本

- [制作手順](docs/PLAYABLE_MAP_WORKFLOW.md)
- [アーキテクチャと素材差し替え](docs/CURRENT_ARCHITECTURE.md)
- [マップデータ](maps/village/map.json)／[キャラ設定](assets/characters/hizuki-v35/character.json)
- [汎用スキル](skills/build-layered-rpg-maps/SKILL.md)
- [淡彩背景ルール](docs/MAP_ART_RULES.md)／[素材契約](docs/MAP_ASSET_CONTRACT.md)
- [隔離記録](old/README.md)

## 検証・配信

```bash
npm test
node tools/verify-archive.mjs
npm run build
```

`dist/` には現行ランタイムのみを含める。`old/`、スキル、テスト、制作中の文書は配信しない。ローカル表示は `dist/` をHTTP配信する。GitHub ActionsではChromium/WebKitの縦横表示・移動・読込・JSON往復を検査してからPagesへ配信する。
