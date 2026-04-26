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
import { LuckyWheel, PlayKitProvider, type LuckyWheelPrize } from '@play-kit/games';
import '@play-kit/games/styles.css';

const prizes: LuckyWheelPrize[] = [
  { label: '$100', win: true,  weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$50',  win: true,  weight: 2 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$20',  win: true,  weight: 3 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$10',  win: true,  weight: 4 },
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

各 game 的 `onWin` / `onClaim` 參數**按該 game 自身語意設計，並非全域統一**：

| Game | `onWin` | `onClaim` |
|---|---|---|
| `LuckyWheel` · `NineGrid` · `ScratchCard` · `SmashEgg` · `SlotMachine` · `LottoRoll` · `GiftBox` · `GiftRain` · `GuessGift` · `DollMachine` · `Marquee` · `DailyCheckin` | `(prize: Prize)` | `(prize: Prize)` |
| `FlipMatch` | `(moves: number, timeSec: number)` | — |
| `Quiz` | `(score: number, total: number)` | — |
| `RingToss` · `ShakeDice` · `Shake` | `(score: number)` | — |

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

## 🌐 Framework 相容

| Framework | Status |
|---|---|
| Next.js (App Router 13+) | ✅ 每個 game 頂部標 `'use client'`，SSR safe |
| Vite + React | ✅ |
| Remix / React Router | ✅ |
| Astro（React island） | ✅ |
| 任何 React 18+ 環境 | ✅（零 runtime 依賴 + 全 SSR-safe） |

---

## 📦 Bundle Size

| Asset | Raw | Gzip |
|---|---:|---:|
| `dist/index.js` (ESM) | 122 KB | 27 KB |
| `dist/index.cjs` (CJS) | 80 KB | 23 KB |
| `dist/index.css` | 52 KB | 10 KB |

支援 tree-shaking — 只 import 用得到的 game、bundler 會剔除其他款。

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
