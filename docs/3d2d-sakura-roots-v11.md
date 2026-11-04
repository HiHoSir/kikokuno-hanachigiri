# 『鬼哭の花契り』桜の根を2D化した比較デモ v11

## 変更範囲
- 独立デモ：`demo-3d2d-sakura-roots-2d-v11.html`。v10と切替比較。
- 幹・太枝を3D（GLB）で維持。**地表へ張り出す根は3Dから除去**。
- 露出した根は曲線と細い長手方向の樹皮模様を用いた独立2Dレイヤー（`sakura_root_back` / `sakura_root_front`）。
- 根元の土・苔・下草・花びらは`sakura_root_ground` / `sakura_root_soil_cover` / `sakura_root_details`で表現。
- 奥・中・前の花3層はv10と同じ画素。全層は520×527px、共通足元アンカー[260,455]。
- マップ上の桜は(10.9,7.2)、幹の当たり判定半径0.26m、根に衝突なし。
- カメラ：平行投影40°俯角・35°方位。背景・歩行・橋・川・既存キャラを変更しない。
- 緋月は`src/map/renderer.js` / `motion.js` / `character-visual.js`の共通処理を参照。独自の旧キャラスプライトは内蔵しない。

## 描画順
奥花 → 土 → 奥の根 → 3D幹 → 手前の根 → 土・苔のかぶせ → 下草・落花 → 中間花 → 前花。

## QA（2026-11-04）
- モデル：低い位置に突き出した3D根を残さず、地面近くのメッシュ半径0.286m → PASS
- 花3層の画素一致 / 9層の合成一致 / 520×527px・足元アンカー一致 → PASS
- 家・川・橋・他の木のPNGハッシュ一致 → PASS
- Chromium 1100×760 / 390×844：切替・層別表示・幹/川の衝突・橋の通行・経路・JS例外なし → PASS
- オフライン検査ではテスト用の仮緋月画像を使用。Pages上の実V35描画とiPhone Safari実機は未確認。

## 再現
本会話の`hanachigiri_sakura_roots_2d_v11_complete.zip`にGLB、9層PNG、カメラ・制作スクリプト、再生成とオフライン検査手順、v10比較素材を同梱。
`source/build_sakura_layers.py`→`source/make_html_v11.py`→`source/test_sakura_roots_v11.py`の順に実行する。

v11は制作方式の試作であり、淡彩背景や桜の完成美術としての採用は未決。既存ゲーム本編のマップ・キャラは非変更。