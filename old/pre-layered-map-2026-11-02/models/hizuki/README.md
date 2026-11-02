# 緋月3Dモデルの候補管理

## 参照モデル（ローカルで検証済み）
- 候補 `hizuki_sculpt_pass_v07.glb` — **未承認**
- 2,152,864 bytes; SHA-256 `8aea0cce9722955706fbff0eb0a737ab517c5cf56627ccb2c3f79b75171e5f0c`
- 161 メッシュ / 18関節を含む skin / 4アニメーション（wave, bow, surprise, cheer）
- v0.8の髪改修は実描画で悪化したため破棄済み。
- 原画との同一性の目視認証・iPhone Safari実機テストは未完了。

## 登録の仕組み
正規の配置場所: `models/hizuki/candidate.glb`。

GitHub Git Data API の `create_blob` (encoding=base64) → `create_tree` → `create_commit` → `update_ref` でバイナリ登録が可能。小サイズのバイナリBlob作成は実動作確認済み。

**未解決の制約**: この会話の実行コンテナにある約2.1MBのGLBファイル内容をGitHubコネクタのAPIに直接渡す、信頼できるバイト転送経路がない。そのためcandidate.glbは未配置。スクリーンショットや空モデルを代わりに登録して成功扱いにしない。

実データが登録されると `.github/workflows/hizuki-3d-quality.yml` が自動実行され、`scripts/audit-hizuki-glb.py` が構造検査/8方向画像、`scripts/compare-hizuki-silhouettes.py` が原画との輪郭一致度を出力する。

GitHub Pagesの確認ページ: `hozuki-walk/hizuki-3d-review.html`。モデルが未配置の場合はエラーを明示する（擬似2D代替画像には切り替えない）。

## Gate
構造検査の成功≠造形認証。完成判定には、正面/右側/背面/斜めの原画との照合、手振り等のモーション中の関節干渉確認、iPhone Safariでの操作確認が必要。
