# Changelog

本檔案由 [Changesets](https://github.com/changesets/changesets) 自動化維護。

提交變更時執行 `pnpm changeset` 新增變更紀錄；release PR 會合併這些紀錄並 bump 版本。

## 未發佈（Unreleased）

### Added
- `@play-kit/games` library 骨架（pnpm monorepo + Vite 5 library mode + TypeScript strict + Vitest + Biome）
- Core primitives：`use-controlled` / `use-reduced-motion` / `haptic` / `is-ssr` / 6-state `state-machine` / `pickPrize` / `StateBadge` / `Confetti`
- i18n provider（`PlayKitProvider` + `useI18n`）與繁中 / 英文字典
- 4 theme token（nocturne / light / neon / holo）CSS variables
- **17 款 game 全數完成 NutUI-tier 工程標準**（每款具備 `forwardRef` + `useImperativeHandle`、controlled/uncontrolled 雙模、5 個模組化 test file（state-machine / ref-api / a11y axe / prize / passthrough）、HTML passthrough、SSR-safe）：
  - Classic Lottery：`lucky-wheel` / `nine-grid` / `scratch-card` / `smash-egg` / `slot-machine` / `lotto-roll` / `gift-box` / `gift-rain`
  - Skill-based：`flip-match` / `quiz` / `shake` / `shake-dice` / `ring-toss` / `guess-gift` / `doll-machine`
  - Loyalty：`marquee` / `daily-checkin`
- Docs site (`apps/docs`)：Sidebar / TopBar / GamePage / CodeBlock（shiki）/ StateMatrix / PropsPlayground / OnThisPage / ApiTable
- `apps/docs/src/registry.ts` 以 Vite `?raw` import 消除 source drift
- `scripts/verify-docs.ts`（ts-morph）自動檢查 registry props metadata 與 `*Props` interface 對齊
- `scripts/check-ssr.ts` 每款 game 跑 `renderToString` 驗證 SSR-safe
- CI workflow（`.github/workflows/ci.yml`）：Biome + typecheck + test + check:docs + check:ssr + library build + docs build，React 18 / 19 雙 matrix
- 開源基線文檔：`CONTRIBUTING.md` / `CODE_OF_CONDUCT.md`（Contributor Covenant 2.1）/ `SECURITY.md` / GitHub issue + PR template

### Pending
- Library build smoke test（實 run + npm publish dry-run）
- CI bundle size budget（每款 gzipped < 8 KB 鎖定）
