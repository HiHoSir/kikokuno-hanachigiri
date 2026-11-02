# 緋月 V8 右向き待機：B / S / T 直接ドット修正検証

[比較用プレビュー（GitHub Pages）](https://hihosir.github.io/kikokuno-hanachigiri/experiments/hizuki-v8-right-idle-manual-T/)

- B 初期基準 → S これまでの自動整理 → T 右向き待機の直接ピクセル編集。
- **画像生成なし・変形なし**。64×96px完全透過、頭身・ポーズ・外周輪郭・接地位置はBと一致。
- Tでは合計337画素のRGBを編集。頭部171画素（瞳2画素を含む）、衣装166画素。
- 外側の透明マスクと最外周のRGBは元Bと一致。
- Tは**右向き待機1枚のみ**。8方向や歩行にはまだ適用していない。
- 元B/S/T PNG、再現スクリプト、337画素の変更座標JSONと詳細QAはChatGPTの `hizuki_v8_right_idle_manual_polish_T_v1.zip` に収録。
