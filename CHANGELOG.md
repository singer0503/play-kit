# Changelog

本 repo 的 release notes 由 [Changesets](https://github.com/changesets/changesets) 自動化維護於各 package。

完整、權威的 release notes 請見：[`packages/games/CHANGELOG.md`](./packages/games/CHANGELOG.md)。

提交變更時執行 `pnpm changeset` 新增變更紀錄；release PR 會合併這些紀錄並 bump 版本。

## 0.2.0 — Full responsive support

17 款 game 全面套用統一 RWD 架構：`useGameScale` hook + CSS 變數 `--pk-px` 設計系統。每款 game 在窄容器自動等比縮放，不再依賴 docs site / 外部 layout 的 patch。

詳見 [`packages/games/CHANGELOG.md` 0.2.0 entry](./packages/games/CHANGELOG.md)。

## 0.1.0 — Initial public release

17 React mini-games with 6-state machines, controlled props, ref API, a11y, SSR-safe, zero runtime deps.
