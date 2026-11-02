# 鬼哭の花契り — 淡彩レイヤーマップ基盤

独立した地面・家・木・橋と、足元基準・歩行面・当たり判定を組み合わせる新しい屋外マップ試作。元の小区画で、家まわり・川岸の植栽と小物を調整しています。旧実装は `old/` に隔離した。

## 遊ぶ・配置する

- 家2軒、木、川と橋の元の範囲です。北側の追加区画は利用者指定で取り除きました。家脇の灯籠・桶・壺、竹垣、石と草花を独立した素材として配置しています。
- 道をタップして経路移動。左下スティック、矢印／WASDでも移動できる。
- 川は歩行不可、橋の床だけで対岸へ渡れる。木の幹と家にはぶつかり、木の前後で遮蔽が変わる。
- 「全景」で全体を確認。「配置・検査」で景物のX/Z位置、歩行面・判定・足元を確認できる。
- 配置を端末に保存し、マップJSONの保存／読み込みで別環境へ引き継げる。
- 緋月は8動作×8方向×8コマ。右下のボタンで歩行／走行を切り替え、実移動距離に歩幅を連動させる。
- 上部の「動作テスト」で各動作を再生・停止・折り畳み。「配置・検査」では向きも指定できる。
- 表示倍率0.85・歩行1.15m/s・走行2.8m/sを採用済み。専用待機素材は未提供のため停止姿勢は仮表示。室内・次のマップは未実装。

## 現行の正本

- [今回の景観調整と未確認事項](docs/VILLAGE_POLISH.md)
- [採用済みのキャラサイズ・移動・モーション規則](docs/CHARACTER_MOVEMENT_RULES.md)
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
