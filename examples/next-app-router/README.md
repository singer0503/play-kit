# Next.js 14 App Router example

展示 `@play-kit/games` 在 Next.js App Router 環境的正確 wire 方式：**server layout + client island**。

## 跑

```bash
pnpm install
pnpm dev        # → http://localhost:3001
pnpm build      # 確認可 production build（含 RSC streaming）
```

## 結構

```
app/
├── layout.tsx              # server component, root layout, import CSS
├── providers.tsx           # 'use client' — wraps PlayKitProvider
├── page.tsx                # server component, contains <h1> + <GameSection />
└── _components/
    └── game-section.tsx    # 'use client' — game 互動本身
```

## 看點

### 1. CSS 在 `layout.tsx` 一次 import

```tsx
import '@play-kit/games/styles.css';
```
Server component 內 import CSS，Next.js bundler 自動處理，所有頁面共用。

### 2. `'use client'` 邊界要劃對

`PlayKitProvider` 用 React Context（client-only），不可在 server component 內直接 render。但**也不必**整個 layout 加 `'use client'`，那會犧牲所有 streaming / RSC 收益。最佳實踐：

```tsx
// providers.tsx
'use client';
import { PlayKitProvider } from '@play-kit/games/i18n';
export function Providers({ children }) { return <PlayKitProvider>{children}</PlayKitProvider>; }

// layout.tsx (still server)
import { Providers } from './providers';
export default function Layout({ children }) {
  return <html><body><Providers>{children}</Providers></body></html>;
}
```

### 3. Game 本身放 client island

`<LuckyWheel>` 可在 server component 內 render，但若要 wire `onWin`、`onEnd` 等 callback，則要把那段抽到 `'use client'` 元件（如本例 `_components/game-section.tsx`）。

## 跑通範本

`page.tsx` server-render 出 `<h1>` + 「靜態介紹文」，game 區塊以 client component 接管。打開 DevTools Network 看：HTML payload 包含 server-rendered `<h1>`，client JS 接管後 game 互動就緒。

## 外部使用者複製這支當 starter

`package.json` 把 `"@play-kit/games": "workspace:*"` 改成 `"@play-kit/games": "^0.3.0"` 即可獨立 clone 跑。
