# @play-kit/games

## 0.3.0

### Minor Changes

- **🎯 Tree-shaking 解放：sub-path imports + multi-entry build**

  從 0.2.x 的「只用 1 款 game = 70.95 KB raw」打到「**11.43 KB raw / 4.83 KB gzip**」（-84%）。Bundler 終於能精準切分。

  ### 新 API：sub-path imports

  ```tsx
  // 推薦（v0.3.0+）：sub-path import
  import { LuckyWheel } from '@play-kit/games/lucky-wheel';
  import { PlayKitProvider } from '@play-kit/games/i18n';
  import { useGameScale } from '@play-kit/games/core';
  ```

  17 款 game 各自有 sub-path（`@play-kit/games/<id>`），`/core` 是 hooks + utilities，`/i18n` 是 PlayKitProvider + dictionary。Sub-path 路徑對應 game id（kebab-case），跟 docs site URL 一致。

  ### 舊用法 0 改動受益

  ```tsx
  // 既有 v0.1 / v0.2 寫法繼續 work
  import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
  ```

  Multi-entry build 的副作用：main barrel 也能精準 tree-shake，0.1/0.2 用戶升級不改 import 也能拿到一樣的 bundle 縮減。

  ### Bundle size 實測（esbuild minify + gzip，external react）

  | 用法 | 0.2.x | 0.3.0 | 改善 |
  |---|---|---|---|
  | 只用 LuckyWheel | 70.95 KB | **11.43 KB** | -84% |
  | 2 款 game | ~71 KB | 17.25 KB | -76% |
  | 全 17 款 | 76.21 KB | 79.90 KB | 持平（含完整 17 款） |

  ### Internal changes

  - `vite.config.ts` 從單 entry 改 19 entry（main + core + i18n + 17 games），rollup 自動切 shared chunks
  - `package.json` exports map 加 19 條 sub-path（每條帶 types/import/require 條件）
  - `dts` plugin 改 `rollupTypes: false`：每個 sub-path 自家 d.ts 維持 source 1:1（IDE go-to-definition 跳到聚焦的小檔，比單檔 924 行的 rolled-up 體驗更好）
  - 移除 `tsc --emitDeclarationOnly` 步驟（vite-plugin-dts 已經會 emit；雙跑會產生 152 個冗餘 d.ts）

  ### CI: bundle size budget 鎖死

  `pnpm smoke:published` 從 6 個檢查擴成 8 個：
  - **新 #7**：17 款 game + core + i18n 所有 sub-path import 可解析
  - **新 #8**：bundle size 預算（only-LuckyWheel ≤ 6 KB gzip、全 17 款 ≤ 30 KB gzip），超標 CI 直接 fail，杜絕未來 size creep

  ---

  ### 同梱（從未發佈的 0.2.2 整合進來）

  - **`@play-kit/games/styles.css` 缺 type declaration**：build 後產 `dist/styles.css.d.ts`，consumer 不需自加 ambient module
  - **README events 對照表 17 款裡 12 款不準**：改寫整張表，每款獨立列出（LuckyWheel 用 `LuckyWheelPrize`、SlotMachine 用 `symbols: number[]`、ShakeDice 用 `(faces, sum)` 等）
  - **README 缺非 bundler runtime 的 CSS import 指引**：新增「測試環境（非 bundler runtime）」一節

  ---

  ### Migration v0.2.x → v0.3.0

  完全相容，無 breaking change。可選的升級動作：

  - 想拿到 sub-path import 的明確意圖：把 `from '@play-kit/games'` 改成 `from '@play-kit/games/<game-id>'`（如 `lucky-wheel`）
  - 想用 hooks 但不引 game：`from '@play-kit/games/core'`
  - 想用 Provider 但不引 game：`from '@play-kit/games/i18n'`

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
