# @play-kit/games

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

  ### Known limitations

  - `slot-machine` 與 `doll-machine` 內部 rAF inline transform 用 px 值；scale=1 時完全正確，scale<1 時動畫位移略大於視覺尺寸（不影響功能，視覺微差）。v0.2.x patch 處理（改用 CSS 變數驅動，JS 寫 unitless 數值）

  ### Other

  - 新增 `e2e/scratch-card.spec.ts`（drag 刮過 → state won/lost）
  - core.css 共用 primitives（`.pk-state-badge` / `.pk-bulb` / `.pk-btn` / 共用 keyframes）全部 RWD-aware

## 0.1.0

### Minor Changes

- Initial public release: 17 React mini-games with 6-state machines, controlled props, ref API, a11y, SSR-safe, zero runtime deps.
