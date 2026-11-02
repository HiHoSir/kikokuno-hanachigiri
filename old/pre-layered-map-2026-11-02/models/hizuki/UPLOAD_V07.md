# v0.7 GLB 登録手順（iPhone Safariでも可能）

GitHub Actionsはリポジトリ内の `models/hizuki/candidate.glb` を自動検査する。このファイルは現在未登録。

**唯一必要な手操作:** [models/hizuki ディレクトリのGitHubアップロード画面](https://github.com/HiHoSir/kikokuno-hanachigiri/upload/main/models/hizuki) を開き、会話で提供された `hizuki_sculpt_pass_v07.glb` を選択して `candidate.glb` の名前で登録する。

1. チャットの v0.7 GLB をiPhoneの「ファイル」に保存する。
2. ファイル名を **candidate.glb** にする（別名でアップロードするとActionsは候補として認識しない）。
3. 上記URLからアップロードし、**Commit changes** を押す。既存ゲームのページには影響しない。
4. [Hizuki 3D model acceptance](https://github.com/HiHoSir/kikokuno-hanachigiri/actions/workflows/hizuki-3d-quality.yml) が実行され、GLB構造・8方向レンダリング・原画とのシルエット比較画像をArtifactsに保存する。
5. [3D目視レビュー](https://hihosir.github.io/kikokuno-hanachigiri/hozuki-walk/hizuki-3d-review.html)を開いて正面・側面・背面、手振り・お辞儀等を確認する。

**検証用のファイル**：2,152,864 byte、SHA-256 `8aea0cce9722955706fbff0eb0a737ab517c5cf56627ccb2c3f79b75171e5f0c`。アップロード後に一致を検証する。

**非承認注意**: v0.7は造形が原画と一致せず、完成モデルではない。GitHubへのアップロードは検査対象の登録のみ。正常性と造形承認を混同しない。

**GitHub Actions権限**: workflow は `contents: read`、モデルの自動改変や自動リリースは行わない。
