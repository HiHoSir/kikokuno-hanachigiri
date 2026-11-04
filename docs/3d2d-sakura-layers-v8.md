# 鬼哭の花契り：桜の幹3D＋花3層2D 実装試作 v8

- 対象 `HiHoSir/kikokuno-hanachigiri` の独立デモ。マップ本編 (`maps/village/map.json`) と緋月V35を変更しない。
- 現行v7をコピーし、桜1本のみのレンダリング方式を変えた。家・川・橋・他の樹木の PNG は v7 とハッシュ一致。
- 平行投影、俯角40°／水平方位35°、足元ワールド座標 `(10.9,7.2)`、桜幹衝突半径0.26mを維持。

## 3Dと2Dの境界

1. `assets/sakura_trunk.glb` は幹・根・太い枝だけの3Dモデル。既存の投影器／テクスチャで `assets/sakura_trunk.png` にレンダリング。
2. `assets/sakura_canopy_back.png` は後方の花、`assets/sakura_canopy_mid.png` は中央、`assets/sakura_canopy_front.png` は前方の花。Python Pillowの決定的な描画で作成。画像生成による完成イメージではない。
3. 4画像は **520×495px・root anchor `[260,455]`** で厳密に一致。PNGの不透明領域で再センタリングしない。
4. ゲームでは、奥の花 → 3D幹 → 中間の花 → 手前の花を、1木アセットの足元にまとめて配置し、従来と同じ深度ソートを使用。
5. 全景のキャラと桜の上下関係は従来と同じ足元深度ソート。葉に衝突は与えない。3Dブランチの遮蔽が必要な高度な構造は後続検証。
6. `sakura_hybrid.png` は各レイヤーの**単純な完成合成画像**。実際のHTMLは画像を4回 `drawImage` して合成する。

## ゲーム内での確認

- `桜レイヤーON / 旧v7`: v8とv7を同条件で比較。
- `層を確認`: 奥花のみ / 幹のみ / 中間花のみ / 前花のみ / 全部、を順番に表示。
- `全景`, `判定`, スティック, 地面タップ, 走る, 初期位置は従来と同様。
- 緋月V35はGithub Pages公開先のPNGを読み込む。通信できないローカルブラウザ検査では仮マーカー表示となる（実キャラ適合合格の証明ではない）。

## 制作・検査

```bash
cd source
python build_sakura_layers.py
python make_html_v8.py
python test_sakura_v8.py
```

依存: Pillow、NumPy、trimesh、numba、Playwright、および実行環境のChromium。
新しい `source/build_sakura_layers.py` が元のGLB骨格を再構築して2D花画像を生成。`source/make_html_v8.py` がデモHTMLに全PNGを埋め込む。既存ソース `build_landscape.py`,`build_watercolor.py`,`build_textured.py`,`build_assets.py` は維持。

### 2026-11-04 検証

- [x] 幹GLBの存在と元3D投影の利用
- [x] 4つのPNGの寸法、原点、可視画素の検査
- [x] 4層の画像合成と`hybrid.png`の画素一致
- [x] 家・橋・川・他の木のPNGハッシュがv7と一致
- [x] Chromium desktop 1100×760 と iPhone相当390×844: 起動、切替、層個別表示、桜幹非通行、川非通行、橋通行、経路探索、判定オーバーレイ、例外なし
- [ ] iPhone Safari実機
- [ ] 公開GitHub PagesにおけるV35画像読込と歩行の目視確認
- [ ] 実キャラの遮蔽・美術適合の承認

## 制約

- 葉の3層は**固定カメラ視点専用の2D素材**。カメラ方位を変えるときは再配置・再描画する。
- 3D幹+2D花という方式の比較実装であって、桜の最終美術FIXではない。
- マップ範囲の拡張は行っていない。モデル全体を3Dで使う旧方式はv7に保存。
- 花びら画像に衝突なし。根元幹の判定は既存と同じ0.26m。特別な低枝判定は未追加。

**配布HTMLだけ**は画像通信量を抑えるためWebP(q86)を埋め込み。元PNGと幹GLBは ZIP 内にそのまま保管。