# Examples

可直接複製當 starter 的最小可跑範例。每支 < 200 行，2 分鐘從 zero 到「螢幕上有 LuckyWheel 在轉」。

| 範例 | 用途 | 跑法 |
|---|---|---|
| [`vite-react/`](./vite-react/) | Vite + React 18 SPA — 最小骨架，加一款 game 就 work | `cd examples/vite-react && pnpm install && pnpm dev` |
| [`next-app-router/`](./next-app-router/) | Next.js 14 App Router — 含 `'use client'` boundary 範例 | `cd examples/next-app-router && pnpm install && pnpm dev` |

兩支都用 `workspace:*` 引本地 `@play-kit/games`，所以總是跑最新 main。**外部使用者** 把 `package.json` 的 `"@play-kit/games": "workspace:*"` 改成 `"@play-kit/games": "^0.3.0"` 即可獨立 clone 跑。
