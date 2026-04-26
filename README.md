# @play-kit/games

> 17 款可嵌入式 React mini-game — 完整狀態機、受控 props、ref API、a11y 內建、SSR-safe、零 runtime 依賴。

[![npm](https://img.shields.io/badge/npm-%40play--kit%2Fgames-red)](#)
[![React 18+](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](#)
[![A11y axe 0](https://img.shields.io/badge/axe-0%20violation-brightgreen)](#)

## ✨ 特色

- **17 款遊戲** 橫跨 3 類：Classic Lottery（抽獎）· Skill-based（技巧）· Loyalty（忠誠度）
- **完整 6-state 狀態機** `idle / playing / won / lost / claimed / cooldown`
- **Controlled + Uncontrolled 雙模式**：後端授權模式與純前端模式皆可
- **Ref API** 透過 `useImperativeHandle` 暴露 `spin / start / reset / claim / getState` 等
- **Bilingual i18n** 繁中 / 英文，`PlayKitProvider` 切換
- **4 theme** `nocturne` (default) · `neon` · `holo` · `light`，CSS variables 驅動
- **WCAG 2.1 AA** `jest-axe` 每個 state 跑過 0 violation，完整鍵盤支援、`prefers-reduced-motion` 回退
- **SSR-safe** 適用 Next.js App Router / Remix
- **零 runtime 依賴** 只需 `react` ≥ 18 作為 peer

## 📦 安裝

```bash
npm install @play-kit/games
# or
pnpm add @play-kit/games
# or
yarn add @play-kit/games
```

## 🚀 快速上手

```tsx
import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
import '@play-kit/games/styles.css';

const prizes = [
  { label: '$100', win: true, weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$20',  win: true, weight: 2 },
  { label: 'Miss', win: false, weight: 4 },
];

export function App() {
  return (
    <PlayKitProvider lang="zh-TW">
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

## 🎮 Ref API（後端權威模式）

```tsx
import { useRef } from 'react';
import { LuckyWheel, type LuckyWheelRef } from '@play-kit/games';

function App() {
  const ref = useRef<LuckyWheelRef>(null);

  async function spinWithBackend() {
    const { prizeIndex } = await fetch('/api/wheel/spin').then(r => r.json());
    ref.current?.spin(prizeIndex);
  }

  return <LuckyWheel ref={ref} prizes={prizes} onEnd={onEnd} />;
}
```

## 🎛 Controlled mode

```tsx
const [state, setState] = useState<GameState>('idle');
const [remaining, setRemaining] = useState(3);

<LuckyWheel
  prizes={prizes}
  state={state}
  onStateChange={setState}
  remaining={remaining}
  onRemainingChange={setRemaining}
/>
```

## 🔌 事件回呼

各 game 的 `onWin` / `onClaim` 參數簽章按照該 game 自身語意而設計，**並非全域統一**：

| Game | `onWin` 參數 | `onClaim` 參數 |
|---|---|---|
| `LuckyWheel` / `NineGrid` / `ScratchCard` / `SmashEgg` / `SlotMachine` / `LottoRoll` / `GiftBox` / `GiftRain` / `GuessGift` / `DollMachine` | `(prize: Prize)` | `(prize: Prize)` |
| `FlipMatch` | `(moves: number, timeSec: number)` | — |
| `Quiz` | `(score: number, total: number)` | — |
| `RingToss` / `ShakeDice` / `Shake` | `(score: number)` | — |
| `Marquee` / `DailyCheckin` | `(prize: Prize)` | `(prize: Prize)` |

完整 callback 參數請見各 game 的 `<Game>Props` 型別定義；docs site 的 Events 區塊有互動範例。

## 🎨 主題切換

```html
<html data-theme="neon">
```

四款內建 theme：`nocturne`（午夜金） `light`（清日間） `neon`（霓虹電子） `holo`（全息漸變）。

## 📚 遊戲清單

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

完整 API 文檔、互動 playground、狀態矩陣：請見 docs site（`pnpm dev`）。

## ⚠️ 開發狀態

目前為 **v0.0.0 early-preview**。核心功能已完成，準備進入公開發佈：

- ✅ 17 款 game 全數對標 NutUI-tier 工程標準（`forwardRef` + ref API、controlled 雙模、i18n 零硬編、a11y axe 0 violation、SSR-safe、HTML passthrough、4 theme）
- ✅ Docs site：互動 playground、state matrix、API tables、原始碼瀏覽，`pnpm check:docs` 自動偵測 props drift
- ✅ CI：Biome / typecheck / vitest / docs drift / SSR / library build / docs build 全線就位
- 🔄 剩餘：library build smoke test、bundle size budget、npm publish dry-run

加入本專案開發請見 [CONTRIBUTING.md](./CONTRIBUTING.md) 與 [CLAUDE.md](./CLAUDE.md)。

## 📜 License

MIT
