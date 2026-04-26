# Vite + React 18 example

最小可跑骨架。`pnpm install && pnpm dev` 開瀏覽器就有 LuckyWheel + ScratchCard 兩款 game，可切 lang / theme。

## 跑

```bash
pnpm install
pnpm dev      # → http://localhost:5173
```

## 看點

- **`src/main.tsx`** — 一行 `import '@play-kit/games/styles.css'`，整套 game CSS 帶進。Vite handles CSS asset 自動。
- **`src/App.tsx`** — sub-path imports（`@play-kit/games/lucky-wheel` / `/scratch-card` / `/i18n`），bundler 自動 tree-shake，只裝兩款 game ≈ 8 KB gzip。
- **`<PlayKitProvider lang theme>`** 包整個 App，runtime 切 lang / theme 即時生效。

## 外部使用者複製這支當 starter

`package.json` 把 `"@play-kit/games": "workspace:*"` 改成 `"@play-kit/games": "^0.3.0"`，即可在 monorepo 外獨立 clone 跑。
