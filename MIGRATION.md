# Migration Guide

從舊 in-browser Babel-standalone playground 遷移到 `@play-kit/games` npm 套件。

## 概覽

舊版是 **直接開 `index.html` 透過 Babel Standalone 執行 JSX** 的 playground，新版是 **可發佈至 npm 的 React 組件庫**。底層架構完全重寫，使用者 API 也重新設計以符合 NutUI-tier 的工程標準。

---

## 主要差異

| 面向 | 舊版（in-browser） | 新版（`@play-kit/games`） |
|---|---|---|
| 載入方式 | `<script type="text/babel" src=...>` + `window.*` global | ES module `import` |
| TypeScript | ❌ 無 | ✅ strict + 完整 `.d.ts` |
| Component 簽名 | `({ lang, t })`，獎品寫死 | 完整 props 接收，獎品由呼叫者傳入 |
| Ref API | ❌ 無 | ✅ `forwardRef` + `useImperativeHandle` |
| Controlled / uncontrolled | ❌ 無 | ✅ state / defaultState 雙模 |
| i18n | ternary 條件句（`lang === 'zh-TW' ? ... : ...`） | `PlayKitProvider` + `useI18n()` |
| a11y | ~5 個 `aria-*` | WCAG 2.1 AA，axe 0 violation |
| SSR | ❌ 直接 access `window` | ✅ SSR-safe hooks + wrappers |
| Theme 切換 | `<html data-theme="dark">` | `<html data-theme="nocturne">`（舊 `dark` 自動 migrate） |
| 測試 / lint | ❌ 無 | Vitest + Biome + jsx-a11y |

---

## 1. 載入 library

### 舊

```html
<script type="text/babel" src="src/games/lucky-wheel.jsx"></script>
<!-- window.LuckyWheel 可用 -->
```

### 新

```bash
npm install @play-kit/games
```

```tsx
import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
import '@play-kit/games/styles.css';
```

---

## 2. Component 使用

### 舊（獎品寫死在 component 內）

```jsx
<LuckyWheel lang={lang} t={t} />
// 獎品、maxPlays、callback 全部無法外部傳
```

### 新（受控 / 非受控雙模）

```tsx
const prizes = [
  { label: '$100', win: true, weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  // ...
];

<PlayKitProvider lang="zh-TW">
  <LuckyWheel
    prizes={prizes}
    maxPlays={3}
    prizeIndex={backendIndex}   // 後端授權模式
    onStart={() => {}}
    onEnd={(prize, idx) => {}}
    onWin={(prize) => {}}
    onLose={(prize) => {}}
    onClaim={(prize) => {}}
  />
</PlayKitProvider>
```

---

## 3. 透過 ref 呼叫方法

### 舊

```jsx
// 不存在。component 無法被外部呼叫
```

### 新

```tsx
import { useRef } from 'react';
import { LuckyWheel, type LuckyWheelRef } from '@play-kit/games';

const ref = useRef<LuckyWheelRef>(null);

ref.current?.spin(5);        // 強制停在 index 5
ref.current?.reset();
ref.current?.claim();
ref.current?.getState();     // 'idle' | 'playing' | 'won' | ...
```

---

## 4. i18n

### 舊（硬編三元式）

```jsx
<button>{lang === 'zh-TW' ? '開始' : 'START'}</button>
```

### 新（一律走 t()）

```tsx
const { t } = useI18n();
<button>{t('action.start')}</button>
```

切換語系：

```tsx
<PlayKitProvider lang={userLang /* 'zh-TW' | 'en' */}>
  {/* 所有 game component 自動跟著切 */}
</PlayKitProvider>
```

---

## 5. 全域 primitives（`window.*`）移除

| 舊 | 新 |
|---|---|
| `window.haptic(30)` | `import { haptic } from '@play-kit/games'` |
| `window.StateBadge` | `import { StateBadge } from '@play-kit/games'` |
| `window.Confetti` | `import { Confetti } from '@play-kit/games'` |

---

## 6. Theme

| 舊 | 新 |
|---|---|
| `<html data-theme="dark">` | `<html data-theme="nocturne">`（`dark` 會被識別為 alias） |
| CSS var 命名 `--bg-0` / `--accent` 等 | 新版為 `--pk-bg-0` / `--pk-accent`，避免與使用者 app 衝突 |

### 若要整合自家 design system

Override `--pk-accent` / `--pk-bg-0` 等 token 即可：

```css
:root[data-theme='nocturne'] {
  --pk-accent: your-brand-color;
}
```

---

## 7. SSR / Next.js App Router

每個 game component 頂部已加 `'use client';` directive，可直接在 RSC tree 內使用。

所有 `window` / `localStorage` access 都包在 `useEffect` 或 SSR-safe hook 內，`renderToString` 不會爆。

---

## 遷移檢查清單

- [ ] 移除所有 `<script type="text/babel" src=...>` 標籤
- [ ] 改用 `npm install @play-kit/games` 並 `import`
- [ ] 補上 `PlayKitProvider` 包裝
- [ ] 將 component 的 props 從「內部寫死」改為「外部傳入」
- [ ] `window.haptic` / `window.Confetti` 等改為 import
- [ ] 任何 `lang === 'zh-TW' ? ... : ...` 改用 `t('key')`
- [ ] `data-theme="dark"` 改為 `data-theme="nocturne"`
- [ ] TypeScript 專案補 `import type { LuckyWheelProps, LuckyWheelRef, GameState }`

---

## 疑難排解

**Q: `[vite] Failed to resolve "@play-kit/games"`**
A: 執行 `pnpm install` 確認 `peerDependencies` 的 React 版本相容。

**Q: Next.js App Router 噴 `useState only works in client component`**
A: 確認 component 頂部有 `'use client';`（library 已附，使用者端無需再加）。

**Q: 我只想用一款 game，會 bundle 全部 17 款嗎？**
A: 不會。Vite / Rollup / webpack 的 tree-shaking 會剔除未使用 export；單款 gzipped 預計 < 8 KB。
