# kikoku AIドット絵ラボ — 32px試作

これは [yakshaのドット絵エディタ](https://github.com/HiHoSir/yaksha-hanamusubi/blob/main/pixel-editor.html) を参照し、画素単位のAI修正実験だけを **kikoku内で独立** して行うための実験です。

## 範囲
- 本編 `index.html`、ゲーム用画像、描画設定は変更しない
- 元のエディタを移植して、32×32/4方向/静止＋歩行A/Bの操作を試せる
- AIに現在の32×32 RGBAグリッドと編集依頼を渡し、変更ピクセルだけをJSONで受け取る
- 差分プレビューで変更量・位置を確認してから適用。既存Undoで戻せる
- iPhone操作UIを元のエディタから再利用
- `reference/sample-yaksha32.png` は旧作からの**比較用画像**であり、kikoku本編への採用を意味しない
- kikokuの方針に従い、**32px制限を本編や新規素材へ導入しない**。これは専用試作のキャンバスサイズだけ

## 開き方
`experiments/ai-pixel-editor/index.html` をHTTP(S)で配信する。
GitHub Pagesへの本番公開状況を確認するまで、ブランチURLをSafari検証URLとは呼ばない。

## AIとの連携方法
1. 「参考用32px緋月を読み込む」を押す、または既存のPNG/JSON読込を使う
2. 方向/コマを選択し、修正指示を記入する
3. 「現在の画素＋依頼文をコピー」を押す
4. ChatGPTに貼り付ける。AIから返ったJSONだけを右の入力欄に貼る
5. 「差分プレビュー」で元絵と比較し、「確認して適用」する
6. 必要ならUndoし、画像/JSONを保存する

## 画素パッチ例
```json
{"format":"yaksha-pixel-patch-v1","direction":"front","pose":"idle","pixels":[{"x":16,"y":12,"rgba":[20,30,60,255]}]}
```

- フレーム名・座標・RGBAを検証し、誤った方向・コマへの貼り付けは拒否
- 自動画像生成なし。AI側から直接GitHubへ更新する機能なし
- 変更適用前の色・画像を保持し、Undoで復元可能
- キーや外部サービス連携は要求しない（コピー・貼り付け方式）

## 検証・制約
- ソースコードのJavaScript構文検査と模擬DOMでの差分パッチ検証を実施
- GitHub上にHTML、JS、参照用PNGを登録
- 実ブラウザ / iPhone Safari / Pages上の動作は別途確認が必要
- 8方向・64×96など**任意サイズの直接ドット描画**は将来拡張案。まだサポートしていない
- 旧作の32px規格を新作へ無審査で持ち込まない

## ソース
- `index.html` — 元エディタのコピー＋AIパッチ欄
- `ai-pixel-bridge.js` — 色パレット付き画素グリッドの指示出力・パッチ検証・プレビュー・Undo付き適用
- `reference/sample-yaksha32.png` — 旧作の参照用サンプル画像
