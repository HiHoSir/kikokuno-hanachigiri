# 鬼哭の花契り — 現行制作規則

## 正本と隔離

- 対象は続編『鬼哭の花契り』、`HiHoSir/kikokuno-hanachigiri`。第1作『鬼哭の花結び』とは別。
- 利用者の最新指定・採用済み実ファイルを優先する。旧作の32px・4方向・過去の衣装・採用状態を持ち込まない。
- 旧実装・素材・モデル・実験・ワークフローは利用者の指示で `old/pre-layered-map-2026-11-02/` に隔離した。通常の作業で `old/` のソースを探索・読込・実行しない。隔離確認には `old/README.md` と移動台帳を使う。明示的な再利用依頼がある場合だけ出典・範囲・適合を確認する。
- ルートの `src/`・`maps/`・`assets/` が現行。旧アーキテクチャ、旧公開ページ、旧テストの合格を現行の事実にしない。配信に `old/` を含めない。

## マップ基盤

- `skills/build-layered-rpg-maps/SKILL.md`、`docs/PLAYABLE_MAP_WORKFLOW.md`、`docs/CURRENT_ARCHITECTURE.md`、`docs/MAP_ART_RULES.md`、`docs/MAP_ASSET_CONTRACT.md` を読む。
- 地面・独立RGBA景物・キャラ・歩行面・判定・足元アンカーを分け、同じ実レンダラーで検証する。一枚絵の自動分解を量産の前提にしない。
- 現行の初回試作はCanvas2D、連続X/Zメートル、平行投影相当40°、100px/m。これは今回の制作契約で、汎用の固定規格ではない。画像寸法・世界座標・表示倍率を区別する。
- 先に経路、次に独立素材、次に実合成・遮蔽・操作を検証する。家や木の画像下端・alphaを当たり判定にしない。橋は床の歩行面だけを追加し、川全体を通行可にしない。
- 景物の表示原点・物理占有・歩行面は同じ配置から派生させる。配置JSONの保存／読込と、別チャットでの再現手順を維持する。
- iPhone Safari優先。クラウドのChromium/WebKit検査とiPhone実機確認を分ける。

## 緋月

- 現行の採用基準は `assets/characters/hizuki-v35/normal.png`。80×112px・30色・角落としありの通常版。元PNGを変更せず `production-record.json` と `character.json` を照合する。
- ジグザグ陰影は不採用の比較実験で、`old/` に保管。採用画像へ取り違えない。
- 登録済みV35の8動作×8方向×8コマは `assets/characters/hizuki/v35-expanded-cells/`。`hizuki-v35/character.json` のmotions台帳から読む。各動作の共通セルとpadding加算後アンカーを維持し、元PNGを変更・反転しない。専用Idle/Interactは未提供。仮停止姿勢はfall先頭コマであり、待機モーション完成とは扱わない。
- `skills/silhouette-first-pixel-art/SKILL.md` と同梱手順・品質ゲートを読む。シルエット→色面下書き→部位限定画素修正→差分再適用→目視比較。自動縮小・減色だけで完成としない。
- 角落としは座標限定・別候補の独立パッチ。通常修正はalpha差分0。アニメは共通セル・尺度・足元アンカー・方向・時刻を維持し、フレームごとに再トリミングしない。

## 検証と公開

- `npm test`、`node tools/verify-archive.mjs`、`npm run build` を実行する。ブラウザ検査は `tools/map-browser-smoke.mjs`。公開対象は `dist/` のみ。
- 素材、静止合成、移動、遮蔽、配置保存、公開、実機検査を別々に報告する。未実装・未確認を合格にしない。
- 依頼範囲内の通常の可逆作業は重ねて許可を求めず進める。旧データを勝手に復帰させない。
