# @play-kit/games

> **17 React mini-games — one component library.** 完整狀態機、受控 props、ref API、a11y 內建、SSR-safe、**零 runtime 非 peer dependency**。

[![npm](https://img.shields.io/npm/v/@play-kit/games.svg?color=red)](https://www.npmjs.com/package/@play-kit/games)
[![npm downloads](https://img.shields.io/npm/dm/@play-kit/games.svg)](https://www.npmjs.com/package/@play-kit/games)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@play-kit/games.svg)](https://bundlephobia.com/package/@play-kit/games)
[![React 18 | 19](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](https://react.dev/)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![A11y axe 0](https://img.shields.io/badge/axe-0%20violation-brightgreen)](https://github.com/dequelabs/axe-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

📚 **[Live Docs + 互動 Playground →](https://play-kit-doc.bwinify.com)**

---

## ✨ 特色

- **17 款遊戲** 橫跨 3 類：Classic Lottery（抽獎）· Skill-based（技巧）· Loyalty（忠誠度）
- **完整 6-state 狀態機** `idle / playing / won / lost / claimed / cooldown`，外部完全可受控
- **Controlled + Uncontrolled 雙模式**：適配「後端權威」與「純前端」兩種場景
- **Ref API** 透過 `useImperativeHandle` 暴露 `spin / reset / claim / getState` 等
- **Bilingual i18n** 繁中 / 英文（`PlayKitProvider lang=`），內部零硬編
- **4 themes** `nocturne`（午夜金，default）· `light` · `neon` · `holo`，CSS variables 驅動、runtime 可切
- **WCAG 2.1 AA**：jest-axe 每個 state 0 violation、完整鍵盤、`prefers-reduced-motion` fallback
- **SSR-safe**：所有 17 款通過 `renderToString` 驗證，適用 Next.js App Router / Remix / 其他 SSR 框架
- **零 runtime 非 peer dependency**：peer 只有 `react` / `react-dom`，無 `framer-motion` / `lottie` / `lodash`

---

## 📦 安裝

```bash
npm install @play-kit/games
# 或
pnpm add @play-kit/games
# 或
yarn add @play-kit/games
```

**Peer deps**：`react` ≥ 18 < 20、`react-dom` ≥ 18 < 20（React 18 / 19 皆可）。

---

## 🚀 快速上手

```tsx
// 推薦：sub-path import — bundler 只把這款 game 拉進去（gzip ~5 KB）
import { LuckyWheel, type LuckyWheelPrize } from '@play-kit/games/lucky-wheel';
import { PlayKitProvider } from '@play-kit/games/i18n';
import '@play-kit/games/styles.css';

const prizes: LuckyWheelPrize[] = [
  { label: '$100', win: true,  weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$50',  win: true,  weight: 2 },
  { label: 'Miss', win: false, weight: 4 },
];

export function App() {
  return (
    <PlayKitProvider lang="zh-TW" theme="nocturne">
      <LuckyWheel
        prizes={prizes}
        maxPlays={3}
        onEnd={(prize, idx) => console.log('landed', prize, idx)}
        onWin={(prize) => console.log('won!', prize)}
      />
    </PlayKitProvider>
  );
}
```

> **舊用法也支援**：`import { LuckyWheel } from '@play-kit/games'` 一樣 work，且因為 multi-entry build，bundler 同樣只會把 LuckyWheel 拉進去（tree-shake 透過 main barrel 也生效）。Sub-path 寫法只是更明確 & 對較舊的 bundler / 不擅長 tree-shake 的環境更穩。

---

## 🎮 Ref API（後端權威模式）

許多場景下，**抽獎結果必須由後端決定**（避免客戶端竄改）。Ref API 讓您先呼叫 API 拿權威結果，再驅動視覺動畫落定到指定獎項：

```tsx
import { useRef } from 'react';
import { LuckyWheel, type LuckyWheelRef } from '@play-kit/games';

function App() {
  const ref = useRef<LuckyWheelRef>(null);

  async function spinWithBackend() {
    const { prizeIndex } = await fetch('/api/wheel/spin').then((r) => r.json());
    ref.current?.spin(prizeIndex);
  }

  return (
    <>
      <LuckyWheel ref={ref} prizes={prizes} onEnd={onEnd} />
      <button onClick={spinWithBackend}>Spin (backend-authoritative)</button>
    </>
  );
}
```

每款 game 的 ref 都有 `getState() → GameState`，可隨時讀當前狀態。

---

## 🎛 Controlled mode

完全外部受控，state machine 由您持有：

```tsx
import { useState } from 'react';
import { LuckyWheel, type GameState } from '@play-kit/games';

function App() {
  const [state, setState] = useState<GameState>('idle');
  const [remaining, setRemaining] = useState(3);

  return (
    <LuckyWheel
      prizes={prizes}
      state={state}
      onStateChange={setState}
      remaining={remaining}
      onRemainingChange={setRemaining}
    />
  );
}
```

每組受控 props 都是 `state` / `defaultState`、`remaining` / `defaultRemaining` 對稱設計，混用合法。

---

## 🔌 事件回呼簽章對照

各 game 的 `onWin` / `onClaim` 參數**按該 game 自身語意設計，並非全域統一**。下表以 `*Props` 型別為準（IDE 跳轉 / TS 自動完成都會看到一樣的東西）：

| Game | `onWin` | `onClaim` | 備註 |
|---|---|---|---|
| `LuckyWheel` | `(prize: LuckyWheelPrize)` | `(prize: LuckyWheelPrize)` | LuckyWheelPrize extends Prize（多 `weight`） |
| `NineGrid` | `(prize: NineGridCell)` | `(prize: NineGridCell)` | NineGridCell ≈ Prize + 格子位置 |
| `ScratchCard` | — | `(prize: Prize)` | 揭曉用 `onReveal(prize)`；`onClaim` 是領取 |
| `SmashEgg` | `(prize: Prize)` | `(prize: Prize)` | |
| `GiftBox` | `(prize: Prize)` | `(prize: Prize)` | |
| `DollMachine` | `(prize: Prize)` | `(prize: Prize)` | |
| `Marquee` | `(prize: MarqueePrize)` | `(prize: MarqueePrize)` | |
| `SlotMachine` | `(symbols: readonly number[])` | `(symbols: readonly number[])` | 三輪停下來的 symbol index |
| `LottoRoll` | `(numbers: readonly number[])` | `(numbers: readonly number[])` | 抽中的號碼 |
| `ShakeDice` | `(faces: readonly number[], sum: number)` | `(faces, sum)` | 各骰面 + 加總 |
| `FlipMatch` | `(moves: number, timeSec: number)` | `(moves, timeSec)` | |
| `Quiz` | `(score: number)` | `(score: number)` | total 在 `onEnd(score, total, won)` |
| `RingToss` | `(hits: number)` | `(hits: number)` | |
| `GiftRain` | `(score: number)` | `(score: number)` | |
| `DailyCheckin` | `(totalPoints: number)` | `(totalPoints: number)` | |
| `GuessGift` | `()` | `()` | 結果由 game 自身 state 決定 |
| `Shake` | `()` | `()` | 同上 |

完整 props / events 表 → [docs site events 區塊](https://play-kit-doc.bwinify.com)。

---

## 🎨 主題切換

兩種寫法擇一：

```tsx
// 推薦：透過 Provider，自動處理 wrapper 與 data-theme
<PlayKitProvider theme="neon">{...}</PlayKitProvider>

// 或：自己在 root 設 data-theme（已有外層 layout 時）
<html data-theme="neon">
```

| Theme | 風格 |
|---|---|
| `nocturne` (default) | 午夜金，深底配金色強調 |
| `light` | 清日間 |
| `neon` | 霓虹電子 |
| `holo` | 全息漸變 |

支援 runtime 切換：改變 `data-theme` 屬性即可，CSS variables 自動 cascade。

---

## 📚 遊戲清單（17 款）

| ID | 分類 | 說明 |
|---|---|---|
| `lucky-wheel` | classic | 8 格幸運轉盤，cubic-bezier 緩停 |
| `nine-grid` | classic | 9 宮格跑燈抽獎 |
| `scratch-card` | classic | Canvas 真實刮除 |
| `smash-egg` | classic | 砸金蛋揭獎 |
| `slot-machine` | classic | 三輪錯開停止 |
| `lotto-roll` | classic | 號碼球抽獎 |
| `gift-box` | classic | 禮盒開箱 |
| `gift-rain` | classic | 禮盒雨點擊 |
| `flip-match` | skill | 翻牌記憶配對 |
| `quiz` | skill | 問答闖關 |
| `shake` | skill | 搖一搖（iOS DeviceMotion） |
| `shake-dice` | skill | 骰盅搖點 |
| `ring-toss` | skill | 套圈圈 |
| `guess-gift` | skill | 你藏我猜（3 cup shell game） |
| `doll-machine` | skill | 夾娃娃機 |
| `marquee` | loyalty | 跑馬燈指針 |
| `daily-checkin` | loyalty | 7 日連簽 |

每款附互動 playground、state matrix、API table、原始碼瀏覽：**[docs site](https://play-kit-doc.bwinify.com)**。

---

## 📱 Mobile / RWD（v0.2.0+）

每款 game 透過 `useGameScale` hook + ResizeObserver 在窄容器自動等比縮放：

- **任意寬度容器**都能塞 — 比設計尺寸窄就等比縮，比設計尺寸寬則保持設計尺寸（不放大）
- **完全 CSS-driven** — `--pk-px` 變數驅動，包含 transform / keyframe 位移、box-shadow、font-size 全部 scale-aware
- **老設備相容** — ResizeObserver 起自 iOS 13.4 / Chrome 64（2018+），覆蓋 ≥ 99% 真實使用者
- **想固定設計尺寸**：`<PlayKitProvider scale="off">`

```tsx
// 自動縮（預設）
<PlayKitProvider>
  <div style={{ width: 240 }}>  {/* 比設計尺寸窄 → 自動縮 */}
    <LuckyWheel prizes={...} />
  </div>
</PlayKitProvider>

// 固定設計尺寸（embedder 自管 layout）
<PlayKitProvider scale="off">
  <LuckyWheel prizes={...} />  {/* 永遠以設計尺寸渲染 */}
</PlayKitProvider>
```

---

## 🌐 Framework 相容

| Framework | Status |
|---|---|
| Next.js (App Router 13+) | ✅ 每個 game 頂部標 `'use client'`，SSR safe |
| Vite + React | ✅ |
| Remix / React Router | ✅ |
| Astro（React island） | ✅ |
| 任何 React 18+ 環境 | ✅（零 runtime 依賴 + 全 SSR-safe） |

---

## 🧪 測試環境（非 bundler runtime）

`import '@play-kit/games/styles.css'` 是 CSS side-effect import — Vite/Next/Webpack 等 bundler 都會處理；但純 Node runtime（`tsx`、`ts-node`、Jest 預設、Vitest 沒開 `css`）會 `ERR_UNKNOWN_FILE_EXTENSION`。

各 runtime 應對：

```ts
// Vitest — vitest.config.ts
export default defineConfig({
  test: { css: true },              // ← 內建支援
});

// Jest — jest.config.js
module.exports = {
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/css-stub.js',  // ← stub 檔內容：module.exports = {};
  },
};
```

**最簡單的辦法**：把 `import '@play-kit/games/styles.css'` 從 component 抽到應用程式 entry（`main.tsx` / `_app.tsx`），測試用的 component 檔不直接 import CSS。`renderToString` / `render` 不需要 CSS 載入即可驗 HTML 結構與 a11y。

---

## 📦 Bundle Size（v0.3.0+）

實測 esbuild minify + gzip，external react/react-dom：

| 用法 | Raw | Gzip |
|---|---:|---:|
| 只用 1 款 game（如 `LuckyWheel`） | 11.43 KB | **4.83 KB** |
| 2 款 game（`LuckyWheel + ScratchCard`） | 17.25 KB | 6.67 KB |
| 只 `PlayKitProvider`（無 game） | 7.00 KB | 2.53 KB |
| 全 17 款（最壞情況） | 79.90 KB | 23.84 KB |
| `dist/styles.css` | 64.91 KB | 10.19 KB |

**每加一款新 game 約 +1–3 KB gzip**。CI 自動跑 `pnpm smoke:published` 鎖死預算上限：only-LuckyWheel 不得超過 6 KB gzip、全 17 款不得超過 30 KB gzip，超標 PR 會被擋。

### Tree-shaking 寫法選擇

```tsx
// ✅ Sub-path import（推薦）— 明確、對所有 bundler 都穩
import { LuckyWheel } from '@play-kit/games/lucky-wheel';
import { PlayKitProvider } from '@play-kit/games/i18n';

// ✅ Main barrel — 也 tree-shake，需 bundler 支援 ESM sideEffects（Vite/Webpack 5/Rollup/esbuild 都行）
import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
```

兩種寫法在 Vite/Next/Webpack 5/Rollup/esbuild 下產出大小幾乎一致（差 < 100 byte）。Sub-path 的好處是**意圖明確**：reviewer 一眼看到只用了哪些 game。

---

## 📚 完整可跑範例

[`examples/`](./examples/) 內有兩支最小可跑骨架，clone 即用：

| Starter | Stack | 跑法 |
|---|---|---|
| [vite-react](./examples/vite-react) | Vite 5 + React 19 SPA | `pnpm install && pnpm dev` |
| [next-app-router](./examples/next-app-router) | Next.js 16 + App Router + React 19 | `pnpm install && pnpm dev` |

Next 版本展示 `'use client'` 邊界正確劃法（root layout 仍是 server component、`PlayKitProvider` 在獨立 boundary、game 互動是 client island）。詳見各 `README.md`。

---

## ❓ FAQ / Troubleshooting

### Q1. Next.js App Router 怎麼 wire？必須整個 layout `'use client'` 嗎？

**不用**。`PlayKitProvider` 用 React Context 必須在 client，但只把它包成獨立 client component 即可，layout 仍可保留 server component（保留 streaming / RSC 收益）。

```tsx
// app/providers.tsx — client boundary
'use client';
import { PlayKitProvider } from '@play-kit/games/i18n';
export function Providers({ children }) {
  return <PlayKitProvider lang="zh-TW">{children}</PlayKitProvider>;
}

// app/layout.tsx — 仍是 server component
import { Providers } from './providers';
import '@play-kit/games/styles.css';
export default function RootLayout({ children }) {
  return <html><body><Providers>{children}</Providers></body></html>;
}
```

完整範例見 [`examples/next-app-router/`](./examples/next-app-router)。

### Q2. 我的 Vitest / Jest 跑 component test 報 `ERR_UNKNOWN_FILE_EXTENSION` 在 `.css`

純 Node 沒 CSS loader。三條解：

```ts
// 解 1：Vitest — vitest.config.ts
export default defineConfig({ test: { css: true } });

// 解 2：Jest — jest.config.js
module.exports = { moduleNameMapper: { '\\.css$': '<rootDir>/test/css-stub.js' } };
// css-stub.js 內容只要 module.exports = {};

// 解 3（最簡單）：把 import '@play-kit/games/styles.css' 從 component 抽到 app entry
//                  （main.tsx / _app.tsx），test 環境的 component 檔不直接 import CSS。
//                  renderToString / render 都不需要 CSS 即可驗 HTML + a11y。
```

### Q3. Game 在我的 CSS Grid 容器內變成全寬、`useGameScale` 沒縮放？

`useGameScale` 量 **parent container** 寬度。如果 game 放在 `display: grid` 或 `display: flex` 的子位置，predefined `min-width: auto` = `min-content`，game 內部 design 寬度會把 grid track 撐大、useGameScale 量到「container 夠大」就不啟動縮放。

修法：把 game 容器的 `min-width` 改 0：

```css
/* 你的 layout */
.my-game-grid > * { min-width: 0; }       /* grid item 可正常縮 */
/* 或 */
.my-game-wrapper { min-width: 0; }        /* flex item 同理 */
```

或直接給容器一個 `max-width: 100%; overflow: hidden;`。

### Q4. 怎麼自定義 theme，可改的 CSS 變數有哪些？

`PlayKitProvider theme="<name>"` 切 4 個內建 theme（`nocturne` / `light` / `neon` / `holo`）。想改色用 CSS variables override：

```css
[data-theme='nocturne'] {
  --pk-accent: oklch(0.85 0.15 200);   /* 換成你的品牌色 */
  --pk-bg-0: #0a0a0f;
}
```

可改的核心 vars（自家命名空間 `--pk-*`）：
- `--pk-bg-0` / `--pk-bg-1` / `--pk-bg-2` — 背景三層
- `--pk-fg-0` / `--pk-fg-1` / `--pk-fg-2` — 文字三層
- `--pk-accent` / `--pk-accent-2` / `--pk-accent-3` — 主強調色
- `--pk-border` / `--pk-border-strong` — 邊框
- `--pk-r-sm` / `--pk-r-md` / `--pk-r-lg` — radius

完整列表見 `packages/games/src/theme/tokens.css`。

### Q5. 我想 opt-in `prefers-reduced-motion`，怎麼測試？

Game 已內建：偵測到 `prefers-reduced-motion: reduce` 自動跳過動畫直達終態。

開發端模擬：Chrome DevTools → Cmd+Shift+P → "Emulate CSS prefers-reduced-motion" → "reduce"。重 render game，按 spin 應**瞬間**揭曉。

### Q6. SSR `renderToString` 後的 HTML 沒帶 CSS，為什麼？

`@play-kit/games/styles.css` 是獨立 entry，不會被 game JS 自動 inline 進 SSR 輸出。Consumer 需在 app HTML `<head>` 自己 link CSS。Next.js / Vite 的 SSR pipeline 已自動處理（`import` CSS 即會 collect 到 head）。手寫 SSR：

```tsx
import { renderToString } from 'react-dom/server';
import { LuckyWheel } from '@play-kit/games/lucky-wheel';

const html = renderToString(<LuckyWheel prizes={prizes} />);

// 別忘了 head 內加：
const fullHtml = `<!doctype html><html><head>
  <link rel="stylesheet" href="/static/play-kit-games-styles.css" />
</head><body><div id="root">${html}</div></body></html>`;
```

### Q7. 升級到 0.3.0 我需要改 import 嗎？

**不需要**。0.3.0 的 multi-entry build 副作用是 main barrel 也精準 tree-shake。`import { LuckyWheel } from '@play-kit/games'` 跟新的 sub-path 寫法產出 bundle 大小幾乎一樣。Sub-path 寫法只是更明確、對較舊的 bundler 也更穩。

---

## 🤝 貢獻

請見 [CONTRIBUTING.md](./CONTRIBUTING.md)。內部工程規範詳見 [CLAUDE.md](./CLAUDE.md)。

歡迎 issue / PR：
- Bug → [Open issue](https://github.com/singer0503/play-kit/issues/new)
- Feature 提案 → 同上，或先 [discussion](https://github.com/singer0503/play-kit/discussions)
- 安全漏洞 → 請勿開 public issue，email 至 `singer0503@gmail.com`

---

## 📜 License

MIT © [singer0503](https://github.com/singer0503)
