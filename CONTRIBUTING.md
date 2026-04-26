# Contributing to @play-kit/games

感謝你願意投入！本文件是外部貢獻者的入口；repo 內部完整工程守則見 [CLAUDE.md](./CLAUDE.md)。

本專案承諾遵守 [Contributor Covenant 行為準則](./CODE_OF_CONDUCT.md)；發現濫用請回報至 `singer0503@gmail.com`。

## End-to-end 測試（Playwright）

```bash
pnpm e2e:build    # 先 build lib + docs（一次性）
pnpm e2e          # 跑全部 spec（48 個，桌機 + iPhone 12 視窗）
pnpm e2e:ui       # 互動式 debug 模式
pnpm e2e:report   # 看上次失敗時的 HTML report
```

涵蓋：
- 17 款 game smoke（路由 + 元件可見 + 無 console error）
- LuckyWheel 深度 happy path（spin → state 轉換 → won/lost）
- Mobile drawer 行為（漢堡 / backdrop / ESC / 自動關）
- Tab 預設回預覽（採納 reviewer 反饋）

PR 提交前 local 跑過 `pnpm e2e` 全綠是基本要求。

---

## 快速開始

```bash
# 需要 Node ≥ 20、pnpm ≥ 9
pnpm install
pnpm dev          # 啟 docs site（port 4321）
```

專案是 pnpm monorepo：

```
packages/games/   @play-kit/games library（發佈到 npm）
apps/docs/        互動文檔站
scripts/          verify-docs（props drift）/ check-ssr（SSR safety）
```

---

## 常用指令

| 指令 | 用途 |
|---|---|
| `pnpm dev` | 啟 docs dev server |
| `pnpm -r typecheck` | 全 workspace TypeScript 檢查 |
| `pnpm -r test` | Vitest run |
| `pnpm lint` / `pnpm lint:fix` | Biome check / auto-fix |
| `pnpm check:docs` | registry props 與 `*Props` interface drift |
| `pnpm check:ssr` | 每款 game 跑 `renderToString` 驗證 SSR-safe |
| `pnpm build:lib` | 只 build `@play-kit/games` |
| `pnpm changeset` | 新增版本變更紀錄 |

---

## 開發流程

1. Fork 這個 repo 並 clone 到本地。
2. 從 `main` 切 branch：`git checkout -b feat/your-feature` 或 `fix/issue-123`。
3. 動手前讀過 [CLAUDE.md](./CLAUDE.md)「核心指導原則」與「NutUI-tier 品質守則」。
4. 實作 + 補測試。
5. 跑完整驗證（必 0 error）：

   ```bash
   pnpm -r typecheck
   pnpm lint
   pnpm -r test
   pnpm check:docs
   pnpm check:ssr
   ```

6. 用 [Conventional Commits](https://www.conventionalcommits.org/) 格式 commit：`feat(lucky-wheel): ...`、`fix(core): ...`、`docs: ...`、`chore: ...`。
7. 若改動影響使用者端 API，請跑 `pnpm changeset` 新增變更紀錄。
8. 推到你的 fork、開 PR 到 `main`。

PR body 固定三段：**改了什麼 / 為什麼（非顯而易見的設計決策）/ 驗證證據**。

---

## 新增 / 修改 game 的檢查清單

打開 PR 前逐項勾選：

- [ ] `packages/games/src/games/<slug>/` 有 5 個檔：`Component.tsx` / `types.ts` / `*.css` / `index.ts` / `__tests__/`
- [ ] `forwardRef` + `useImperativeHandle` 暴露的 method，runtime 都呼叫得到（不得與 `registry.ts` 的 `api.methods` 漂移）
- [ ] Controlled props 對齊（`state` / `defaultState`、`remaining` / `defaultRemaining` 等）；實作走 `core/use-controlled.ts`
- [ ] 所有字串走 `useI18n().t(key, params)`，**無 `lang === 'zh-TW' ? ... : ...` 硬編**
- [ ] Props 介面 extends `BaseGameProps`（透傳 `className` / `id` / `style` / `data-*` / `aria-*` 到根 `<section>`）
- [ ] a11y：根 `<section>` + `aria-label`、`<button type="button">`、`aria-live` region、`aria-hidden` 裝飾、keyboard Enter/Space、`useReducedMotion()` 守衛
- [ ] 4 個 theme（`nocturne` / `light` / `neon` / `holo`）肉眼檢查過
- [ ] 5 個 test 檔齊：`state-machine` / `ref-api` / `a11y`（axe 0 violation）/ `prize` / `passthrough`
- [ ] SSR-safe：`window` / `document` / `localStorage` / `Canvas` 一律在 `useEffect` 內 access 或走 `core/is-ssr.ts`；`.tsx` 頂部標 `'use client';`
- [ ] `apps/docs/src/registry.ts` 加完整 entry（`api.props` / `events` / `methods` / `types` / `knobs` / `defaultProps` / `source` `?raw` import）
- [ ] `packages/games/src/index.ts` 加 `export * from './games/<slug>'`
- [ ] `scripts/verify-docs.ts` 的 `games` array 加入該 game
- [ ] Changeset 已加

---

## 禁止事項

- 禁止新增 runtime dependency（`packages/games/dependencies` 欄位必須為空）
- 禁止跳過 hook（`--no-verify`）
- 禁止 `git add -A` / `git add .`（只 add 明確列出的檔案）
- 禁止 amend commit（pre-commit hook 失敗時修好、重新 stage、開新 commit）
- 禁止 inline `lang === 'zh-TW' ? ... : ...` 三元式 i18n

---

## 問問題 / 回報 bug

- Bug：用 [Bug report](https://github.com/singer0503/play-kit/issues/new?template=bug_report.yml) template
- Feature：用 [Feature request](https://github.com/singer0503/play-kit/issues/new?template=feature_request.yml) template
- 安全漏洞：**勿開 public issue**，請 email 至 `singer0503@gmail.com`（詳見 [SECURITY.md](./SECURITY.md)）
