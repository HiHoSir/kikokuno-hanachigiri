# 3D→2D桜デモ v9：本編キャラクター描画への接続

対象: `HiHoSir/kikokuno-hanachigiri`、`main`。
デモ: `demo-3d2d-sakura-shared-character-v9.html`。
方針: v8の桜の幹3D＋花3層、背景PNG、カメラ（俯角40°・方位35°）、当たり判定、移動入力は維持。キャラ画像とアニメ処理だけを現行本編と共有する。

## 改修

- デモに埋め込まれていた古い `sheets`（歩行80x118・走行80x121・待機fall先頭）と時間/距離の独立したコマ選択を削除した。
- 本編 `src/map/renderer.js` の `loadCharacter()`、`src/map/motion.js` の `MotionPlayer`、新しく共有化した `src/map/character-visual.js` の `drawCharacterFrame()` をデモから直接importする。
- `src/map/renderer.js` の本編描画箇所も `drawCharacterFrame()` に委譲した。両ページの足元アンカー、scale、画像補間、シート切り取り処理が一箇所になる。
- キャラ台帳 `assets/characters/hizuki-v35/character.json` をデモ起動時に取得する。待機・歩行・走行の3シートだけをロードするため `loadCharacter(url,{motions:[...]})` オプションを追加（指定なしの本編動作は従来通り全部読む）。
- `character.json` から `motions.idle/walking/running` のサイズ、8方向の行順、アンカー、`smooth`、表示倍率、走行/歩行速度、足元半径、実距離当たりの周期を取得する。現行の待機v21・歩行v23・走行v23をそのまま使用。
- JSONはページを開くたび別のキャッシュキーを付与し、同じキーを画像へ継承する。将来の別作業によるキャラ素材更新も**ページ再読込時**に反映される（閲覧中のホットスワップではない）。
- キャラクターの画像取得が失敗した場合だけ「未読込」仮マーカーを表示し、デモマップの動作は維持。これは完成画像の代替ではない。

## 既存基準

- 緋月を背景に合わせて勝手に拡縮しない（`character.json` のscaleを使用）。
- モーションのセル余白をフレームごとにトリミング・再センタリングしない。
- 移動した実距離で歩行・走行位相を進め、止まった場合は専用Idleを時間駆動する。
- 3D→2Dマップの座標・橋・川・桜の幹当たり判定は変更しない。
- `old/` の旧キャラ・旧エンジンは参照しない。

## 検査

- `node --check` で新規キャラ描画モジュールとデモのmoduleスクリプトの構文を確認。
- 新規 `tests/character-visual-shared.test.js` によって実台帳を基準にidle/walk/runのフレーム、コマ境界、足元アンカー、smooth、描画拡縮を回帰検査。
- キャラクター描画関数のローカル単体テスト2件を通過。
- **ブラウザ実プレイ**: この実行環境ではChromiumが接続を管理ポリシーで遮断したため、v9の動的ブラウザ実機検査は未完了。旧v8のブラウザ検査をv9の合格に流用しない。
- **GitHub Pages公開配信・iPhone Safari実機**: 未確認。GitHubへのファイル登録とビルド許可リスト追加は別途確認。

## 今後の運用

別作業でキャラの表示方式を更新する場合、まず本編側の `character.json` / `src/map/motion.js` / `src/map/character-visual.js` / `src/map/renderer.js` を修正し、`npm test`と実機動作を検査する。デモに寸法やコマ定義を複製しない。背景側のみ変更する際はキャラ素材へ手を入れない。