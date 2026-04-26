# @play-kit/games

## 0.2.2

### Patch Changes

- **docs/types: consumer DX 修補（無 runtime 行為改變）**

  從 consumer 角度做完整 e2e DX review 後找到的 3 個 paper cut，全部是 docs/types 層級，consumer 無感升級即可拿到改進。

  ### Fixed

  - **`@play-kit/games/styles.css` 缺 type declaration**（TS strict 模式下 `import '@play-kit/games/styles.css'` 會 TS2882 "Cannot find module"）
    - 新增 `dist/styles.css.d.ts`（空 module declaration）
    - `exports['./styles.css']` 改為 `{ types, default }` 條件式，TS bundler/node resolution 都能找到
  - **README events 對照表 17 款裡 12 款不準**（按 README 抄會 tsc fail）
    - 改寫整張表，每款獨立列出實際簽章（以 `*Props` interface 為準）
    - 標記 LuckyWheel 用 `LuckyWheelPrize`、NineGrid 用 `NineGridCell`、Marquee 用 `MarqueePrize`、SlotMachine 用 `symbols: number[]`、LottoRoll 用 `numbers: number[]`、ShakeDice 用 `(faces, sum)`、Quiz 只有 `score`（total 在 `onEnd`）、ScratchCard 沒有 `onWin`（用 `onReveal`）等正確簽章
  - **README 缺非 bundler 環境的 CSS import 指引**
    - 新增「測試環境（非 bundler runtime）」一節，說明 Vitest `css: true`、Jest `moduleNameMapper`、與「把 CSS import 抽到 app entry」三條解法
    - Tsx / ts-node / Vitest 預設 / Jest 預設 import `@play-kit/games/styles.css` 會 `ERR_UNKNOWN_FILE_EXTENSION`，這個是 React library 共通限制，但 README 沒寫 → consumer 第一次踩會懵

  ### Verification

  - 在乾淨 consumer project（`/tmp/pk-smoke`）裡 README quickstart 範例 strict TS `tsc --noEmit` 通過、不需 ambient `declare module`
  - 17 款 onWin/onClaim 簽章 README 與 d.ts 1:1 對齊
  - smoke-published.mjs 6/6 pass

## 0.2.1

### Patch Changes

- **fix(build): CJS bundle 不再 `require('./index.css')`**

  0.2.0 published artifact 在純 Node CJS 環境（Jest 預設、SSR 部分情境、`node -e "require('@play-kit/games')"` smoke test）會 `SyntaxError: Unexpected token '.'` —— 因為 `dist/index.cjs` 第一行有 `require('./index.css')`，Node 沒有 CSS loader 把 CSS 規則當 JS 解析。

  ### 修法

  - 移除 `vite-plugin-lib-inject-css`（plugin 對 ESM/CJS 一視同仁地產 `import/require './index.css'`，CJS 路徑無解）
  - 移除 `src/index.ts` 中的 `import './styles.css'`（不再透過 JS 帶進 CSS）
  - 各 game 的 CSS 仍會合併進 `dist/index.css`（`cssCodeSplit: false` + 各 Component.tsx 自身 `import './*.css'`）

  ### Consumer 影響

  - **使用 README 寫法（顯式 `import '@play-kit/games/styles.css';`）— 完全無感**，這就是現在唯一受支援的引用方式
  - 若 0.2.0 期間有依賴 JS 自動帶入 CSS 的人（不 follow README 用法）：補一行 `import '@play-kit/games/styles.css';` 即可
  - 純 Node CJS / Jest 環境：本來就壞掉，這次修好

  ### Verification

  - `node -e "console.log(Object.keys(require('@play-kit/games')).length)"` 純 Node CJS 可正確 require
  - `dist/index.cjs` head 不再含 `require('./index.css')`
  - `dist/index.css` size 不變

## 0.2.0

### Minor Changes

- **v0.2.0 — Full responsive support**

  17 款 game 全面套用統一 RWD 架構：`useGameScale` hook + CSS 變數 `--pk-px` 設計系統。每款 game 在窄容器自動等比縮放，不再依賴 docs site / 外部 layout 的 patch。

  ### 新增 API

  - `useGameScale(designWidth, options?)` — Core hook，每款 game 在自己的根 `<section>` 掛 `ref={scaleRef}` 即可開啟自動 RWD（已內建在 17 款 game）
  - `useScalePolicy()` — 讀取 `PlayKitProvider scale="auto" | "off"` 政策
  - `PlayKitProvider` 新增 `scale` prop（預設 `'auto'`）

  ### CSS 規約

  - `.pk-game` 根 selector 自動定義 `--pk-px: calc(1px * var(--pk-scale, 1))`
  - 所有 scalable px 用 `calc(N * var(--pk-px, 1px))`，包含寬高 / padding / radius / font-size / box-shadow blur / transform translate / keyframe 位移
  - 例外（保持 raw px）：`border-width` / `outline-width` / 微小 ornamental（≤ 2px）

  ### 老設備支援

  - ResizeObserver: iOS 13.4+ / Chrome 64+（2018 起）
  - CSS Custom Properties: 全現代瀏覽器（2016 起）
  - 無 ResizeObserver 環境 fallback 為設計尺寸

  ### Migration v0.1.x → v0.2.0

  - 既有 `<LuckyWheel />` 等 component 用法不變
  - 預設行為改變：在窄容器（< 設計寬度）會自動縮，不再溢出
  - 想保持舊行為（固定設計尺寸）：`<PlayKitProvider scale="off">`

  ### Other

  - `slot-machine` 內部 rAF 寫 transform 前讀 `--pk-scale` 乘上去，視覺位移與 symbol 高度同步（任意 scale 都正確）
  - `doll-machine` 內部 rAF 用 `%` 為單位（已 scale-friendly，無需額外處理）
  - 切 game 時 docs site 自動 scroll 回頁頂（不再卡在前一頁的 props/events 表底）
  - StateMatrix tile 包 `<PlayKitProvider scale="off">`，避免與 transform: scale(0.4) thumbnail 雙重縮放打架
  - 新增 `e2e/scratch-card.spec.ts`（drag 刮過 → state won/lost）
  - core.css 共用 primitives（`.pk-state-badge` / `.pk-bulb` / `.pk-btn` / 共用 keyframes）全部 RWD-aware
  - `PlayKitProvider` 巢狀 friendly：未指定 `lang` / `scale` 時繼承外層 context（不再強制 default 'zh-TW' / 'auto'）

## 0.1.0

### Minor Changes

- Initial public release: 17 React mini-games with 6-state machines, controlled props, ref API, a11y, SSR-safe, zero runtime deps.
