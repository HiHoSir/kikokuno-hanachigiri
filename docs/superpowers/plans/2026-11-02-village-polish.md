# 村の見た目改善 Implementation Plan

**Goal:** 北側の追加範囲を取り消し、元の村に参考画像の植栽・石組み・生活感を加える。
**Architecture:** 既存Canvas2Dと配置JSONを使用。元PNGを保全し、独立RGBA景物を同じアンカー・物理占有の方式で配置する。
**Tech Stack:** Canvas2D / JSON / Node tests / Playwright。
**Spec:** docs/superpowers/specs/2026-11-02-village-polish-design.md

## 制約と確認
main直接。40°・100px/m・緋月の設定を維持。北側の保存配置をrevision更新で無効化。足元と判定、戸口と橋の到達、JSON保存、地面取得失敗、縦横描画を確認する。

- [x] 北側へ進めないことを失敗するテストで固定する。
- [x] 追加地面・北側配置を外し、旧範囲へ戻す。
- [x] 石花壇・玄関脇小物・竹垣を透過PNGとして登録、判定を持たせて配置。実レンダラーで大きさ・接地・通行を確認する。
- [x] マップ検査を元の範囲と汎用の追加地面互換検査に更新する。
- [x] Node・素材・アーカイブ・build・ブラウザ検査を実行、ローカルはChromium縦横合格。main反映・GitHubのWebKit検査・配信確認は公開段階で結果を確認する。
