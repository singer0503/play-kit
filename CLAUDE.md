# CLAUDE.md

本檔案為 Claude Code（claude.ai/code）在此 repo 內工作的指引。

---

## 這是什麼

`@play-kit/games` —— 17 款 React mini-game 的 component library，對標 NutUI 工程水準：完整 TypeScript 型別、受控/非受控雙模、ref API、a11y 內建、SSR-safe、零 runtime 非 peer dependency。

- **Library**：`packages/games` → 發佈至 npm
- **Docs site**：`apps/docs` → 互動 playground + state matrix + API tables + raw source 瀏覽
- **語系**：繁中（主）+ 英文雙語，所有使用者可見字串走 i18n，禁止硬編

---

## 核心指導原則（Karpathy 四條）

動手前必讀。這是「不讓 diff 變亂、不過度工程、不誤改無關段落」的底線。

### 1. Deliberate Approach｜深思熟慮
- 動手前先讀完相關檔案
- 如果不只一種合理解讀，請寫 1–3 行 approach summary 給出選擇與理由，不要默默挑一種
- 不理解的 code 不要碰。卡住就 pause，別硬推

### 2. Minimal Solutions｜最小方案
- 只實作被要求的事，**不加附加功能**
- 不替「未來可能用到」的情境加抽象層
- 50 行能做完的事不要寫成 200 行。若發現自己在寫重複模式，停下來先想有沒有現成 helper 可用

### 3. Precise Edits｜精準修改
- 修改時配合當前檔案的風格
- 只刪「你自己改動導致的 dead code」，不順手清理既有的
- `git diff` 應只含與當前 task 直接相關的 line。不要順手 rename variable、不要順手重排 import
- **特別注意：M6 照 NineGrid template 複製新 game 時，只加 new file，不修改已完成 game 的內容**

### 4. Verification-Centered Tasks｜驗證中心
每個 task 結束必須給可驗證的證據：

```
pnpm -r typecheck    # 0 error
pnpm lint            # 0 error (Biome)
pnpm -r test         # all pass
pnpm check:docs      # props drift: 全 games 對齊
pnpm check:ssr       # SSR import safe
pnpm e2e:build && pnpm e2e   # Playwright e2e（48 spec / desktop + mobile）
```

沒 proof 的 task 一律視為未完成。UI 改動還要手動開 `pnpm dev` 瀏覽器確認（型別對不等於畫面對）。

---

## Repo 結構與指令

### 目錄速查

```
mini-game/
├── packages/games/              # @play-kit/games（library）
│   └── src/
│       ├── core/                # 狀態機 / hooks / types / StateBadge / Confetti
│       ├── i18n/                # PlayKitProvider + zh-TW + en
│       ├── theme/               # 4 theme CSS vars + TS tokens
│       ├── games/<slug>/        # 每個 game：Component.tsx / types.ts / *.css / index.ts / __tests__/
│       ├── index.ts             # 主 barrel
│       └── styles.css           # 合併匯出
├── apps/docs/                   # Docs site（Vite app）
│   └── src/
│       ├── App.tsx + layout/ + routes/ + docs-ui/
│       ├── registry.ts          # game metadata + ?raw source import
│       └── i18n/                # docs site 自己的字串
├── scripts/
│   ├── verify-docs.ts           # ts-morph drift check
│   └── check-ssr.ts             # SSR safety
└── CLAUDE.md / README.md / CHANGELOG.md / MIGRATION.md
```

### 常用指令

| 指令 | 用途 |
|---|---|
| `pnpm dev` | 啟 docs dev server（port **4321**） |
| `pnpm build` | 所有 workspace build |
| `pnpm build:lib` | 只 build `@play-kit/games` |
| `pnpm -r typecheck` | 全部 workspace TypeScript 檢查 |
| `pnpm -r test` | Vitest run |
| `pnpm -C packages/games test:coverage` | coverage 報告 |
| `pnpm lint` / `pnpm lint:fix` | Biome check / auto-fix |
| `pnpm check:docs` | registry props metadata vs `*Props` interface drift |
| `pnpm check:ssr` | `renderToString` 跑每款 game，確認 SSR-safe |
| `pnpm e2e:build` | 先 build lib + docs（e2e 跑前一次性） |
| `pnpm e2e` | Playwright e2e 全跑（17 款 smoke + 深度 + mobile drawer / tab 預設） |
| `pnpm e2e:ui` | Playwright UI 互動模式 debug |
| `pnpm e2e:report` | 看上次 e2e HTML report |
| `pnpm changeset` | 新增版本變更紀錄 |

### 技術棧

- **Build**: Vite 5 (library mode) + `vite-plugin-dts`（rollup 單檔 d.ts）+ `vite-plugin-lib-inject-css`
- **TypeScript**: 5.5, strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax`
- **測試**: Vitest + `@testing-library/react` + jsdom + `jest-axe`
- **Lint / Format**: Biome 1.9（含 a11y rules）
- **Docs highlight**: shiki（github-dark / github-light）

---

## NutUI-tier 品質守則（不可違反）

任何 PR 違反其中一條都不應 merge。這是 library 之所以是 library 的底線。

### 1. Controlled props 必須
每款 game component 都要提供 controlled + uncontrolled 雙模式：
- `state` / `defaultState`、`remaining` / `defaultRemaining` 等成對
- 實作一律用 `packages/games/src/core/use-controlled.ts`，**不要自己寫 if-else**

### 2. Ref API 必須
用 `forwardRef` + `useImperativeHandle` 暴露 `spin / start / reset / claim / getState` 等。
**凡 registry 中 `api.methods` 列出的 method，runtime 就要能呼叫得到**。若 method 不存在 → 改 docs 或加實作，不可留 drift。

### 3. i18n 零硬編
- 禁止 `lang === 'zh-TW' ? '刮開' : 'SCRATCH'` 這類 inline ternary
- 所有字串走 `useI18n().t('key', params)`
- 新增 key 時同時更新 `i18n/en.ts` 與 `i18n/zh-TW.ts`（型別會強制 key 集合一致）

### 4. a11y 最低標
- 根容器用 `<section>` 或 `role="region"` + `aria-label`（fallback 到 i18n 預設）
- 所有互動用 `<button type="button">`，**不要** `<div onClick>`
- `aria-live="polite"` region 宣告狀態變化（中獎獎品名稱等）
- 裝飾元素 `aria-hidden="true"`
- 鍵盤：Enter / Space 必可觸發主動作
- 動畫一律經 `useReducedMotion()` guard；reduced-motion 時要提供替代路徑（直接跳到終態）
- **`jest-axe` 對每個 state（全 6 態）跑，0 violation 才算通過**

### 5. 6-state 強制
state 只能是 `'idle' | 'playing' | 'won' | 'lost' | 'claimed' | 'cooldown'` 之一。
即使 game 天然沒有 cooldown（如 flip-match），受控傳入 `state="cooldown"` 時仍要 render 合理 UI（disabled 按鈕）。禁止自創 state 名（如 `'active'` / `'done'`）。

### 6. SSR-safe
- `window` / `document` / `localStorage` / `navigator` / `Canvas` / `DeviceMotion` 一律在 `useEffect` 內 access，或走 `core/is-ssr.ts`、`core/haptic.ts`、`core/use-reduced-motion.ts` 等 wrapper
- 每個 game `.tsx` 頂部標 `'use client';` directive（Next.js App Router 相容）
- `pnpm check:ssr` 必通過

### 7. 零 runtime 非 peer deps
- `packages/games/dependencies` 必須為空
- `peerDependencies` 只有 `react` / `react-dom`
- **禁止** `framer-motion` / `lottie-react` / `lodash` / `classnames` 等；動畫用 CSS / `requestAnimationFrame`

### 8. 根容器定位 context（overlay 錨定）
- 每款 game 的根 `<section>` 必須帶 `pk-game` class（core.css 會補 `position: relative; isolation: isolate`）
- 這是 `.pk-confetti` / `.pk-flash` 等 absolute overlay 的錨定點；缺了會讓彩帶飄滿整個頁面
- Confetti 本身以 `container-type: size` + `cqh` 單位計算落距，**不再依賴 viewport `vh`**

### 9. HTML passthrough 必須
每款 game 的 Props 都 extends `BaseGameProps`，透傳以下到根 `<section>`：
- `className`（merge 不取代）、`id`、`style`、`data-*`、`aria-*`
- 實作模式：destructure 挑出內建消費的 key（如 `'aria-label': ariaLabel`），其餘 `...rest` 展到根 section 上
- 測試：`lucky-wheel/__tests__/passthrough.test.tsx` 為代表，新增 game 後更新相關測試

### 10. Provider API
- `PlayKitProvider` 支援 `lang` / `theme` / `scale` / `wrap` / `className` / `data-*` 等 props
- 傳 `theme` 時自動 wrap 一層 `<div className="pk-root" data-theme>`；tokens.css 自動切 palette
- 未傳 `theme` 時不多包 DOM，避免 layout 汙染
- `scale` 預設 `'auto'`：game 在窄容器自動等比縮（見規則 11）；`'off'` 關閉縮放維持設計尺寸

### 11. RWD 規約（v0.2.0+）

每款 game 透過 `useGameScale(designWidth)` hook 在窄容器自動等比縮放。
**所有 fixed pixel 值都必須用 `calc(N px * var(--pk-scale, 1))` 表達**，包含：

| 類別 | 改寫前 ❌ | 改寫後 ✅ |
|---|---|---|
| 寬高 | `width: 360px` | `width: calc(360px * var(--pk-scale, 1))` |
| Padding / margin | `padding: 20px` | `padding: calc(20px * var(--pk-scale, 1))` |
| Border-radius | `border-radius: 12px` | `border-radius: calc(12px * var(--pk-scale, 1))` |
| Font-size | `font-size: 14px` | `font-size: calc(14px * var(--pk-scale, 1))` |
| Box-shadow blur | `box-shadow: 0 4px 12px ...` | `box-shadow: 0 calc(4px*var(--pk-scale, 1)) calc(12px*var(--pk-scale, 1)) ...` |
| Transform translate | `transform: translate(14px, -18px)` | `transform: translate(calc(14px*var(--pk-scale, 1)), calc(-18px*var(--pk-scale, 1)))` |
| Keyframe 位移 | `50% { transform: translateY(-180px); }` | `50% { transform: translateY(calc(-180px * var(--pk-scale, 1))); }` |
| Canvas 尺寸（JS） | `canvas.width = 320 * dpr` | `canvas.width = 320 * scale * dpr`（scale 從 hook 讀）|

**例外（不需 scale）**：
- `border-width: 1px` 等視覺粒度（小於 2px 縮放會看不見）
- 線性漸層 stops（`%` 本身已比例）
- `rgba()` / `oklch()` 顏色

**Component 端模板**：

```tsx
import { useGameScale, useScalePolicy } from '@play-kit/games';

const DESIGN_WIDTH = 340; // 各 game 自宣告

export const LuckyWheel = forwardRef<LuckyWheelRef, LuckyWheelProps>((props, ref) => {
  const policy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(DESIGN_WIDTH, { enabled: policy === 'auto' });
  // ... rest

  return (
    <section ref={scaleRef} className="pk-game pk-lw" {...rest}>
      {/* ... */}
    </section>
  );
});
```

**驗證**：每款 game 完成後手動測 320 / 360 / 390 / 768 四個 viewport 視覺正確。

---

## 每個 game 新增 / 修改的檢查清單

打開 PR 前逐項勾選：

- [ ] `games/<slug>/` 有完整 5 個檔：`Component.tsx` / `types.ts` / `*.css` / `index.ts` / `__tests__/`
- [ ] `forwardRef` + `useImperativeHandle` 暴露 ref methods
- [ ] Controlled props 對齊（state / defaultState、remaining / defaultRemaining 等）
- [ ] 所有字串走 `t()`，**無 ternary `lang === ...` 判斷**
- [ ] a11y：根 `<section>` + `aria-label`、`<button type="button">`、`aria-live` region、`aria-hidden` 裝飾、keyboard Enter/Space、`useReducedMotion()`
- [ ] 4 個 theme（`nocturne` / `light` / `neon` / `holo`）都肉眼檢查過
- [ ] **RWD 規約**：所有 fixed px 用 `calc(N px * var(--pk-scale, 1))`、`useGameScale(designWidth)` ref 掛根 section、4 viewport 視覺驗證
- [ ] 4 個 test file 齊：`state-machine` / `ref-api` / `a11y`（axe）/ `prize`
- [ ] Coverage ≥ 85%（lines / functions / statements）、branches ≥ 80%
- [ ] SSR-safe（`pnpm check:ssr` 通過）
- [ ] `apps/docs/src/registry.ts` 加入完整 entry（含 `api.props` / `events` / `methods` / `types` / `knobs` / `defaultProps` / `source` `?raw` import）
- [ ] `pnpm check:docs` 通過（props metadata 與 `*Props` interface 對齊）
- [ ] `packages/games/src/index.ts` 加上 `export * from './games/<slug>'`
- [ ] `scripts/verify-docs.ts` 的 `games` array 加入該 game
- [ ] Changeset 已加（`pnpm changeset`）

---

## Git / commit 規範

- **Conventional Commits**：`feat(lucky-wheel): ...`、`fix(core): ...`、`chore: ...`、`docs: ...`
- 一個 PR 原則上只改一款 game 或一個 package
- PR body 固定三段：
  1. **改了什麼**（what）
  2. **為什麼**（why — 非顯而易見的設計決策）
  3. **驗證證據**（test output、screenshot、`check:docs` log）

---

## 不要做的事

- **不要走回 `window.*` global 路線**（舊 in-browser playground 做法，已廢棄）
- **不要把 docs-only code 寫進 game component**；docs site 相關邏輯放 `apps/docs`
- **不要把 CSS 變數從 `theme/tokens.css` 散出到各 game CSS**；token 集中管理
- **不要 amend commit**。Hook 失敗時修好、重新 stage、開新 commit
- **不要 `git add -A` / `git add .`**；只 add 明確列出的檔案，避免誤 commit `.env` / secrets
- **不要跳過 hook**（`--no-verify`）
- **不要手動升級 `peerDependencies` 範圍** 越過 React 19 前務必先跑 smoke test

---

## 當前進度（2026-04-25）

- ✅ M1–M5：infra / core / docs shell / docs 進階 UI（完成）
- ✅ M6：17 款 game 全數完成 NutUI-tier 標準（`lucky-wheel` 為範本，其餘 16 款照同一結構複製；每款皆具 `forwardRef` + ref API、controlled/uncontrolled 雙模、i18n 零硬編、a11y axe 0、SSR-safe、HTML passthrough、4 theme）
- 🔄 M7–M10：registry 全數、library build smoke test、bundle size budget、npm publish dry-run、CI 收緊、發佈 tag

所有 milestones 的 acceptance criteria 見 `/Users/max/.claude/plans/1-claude-md-transient-flame.md`。
