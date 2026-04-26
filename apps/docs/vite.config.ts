import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Docs site 使用 Vite 原生 dev server；以 path alias 直接引用 library 源碼，
// 讓 HMR 改 game component 時 docs 即時刷新，不需重 build。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // sub-path：先 match，讓 `@play-kit/games/styles.css`、`.../games/lucky-wheel/*.tsx?raw` 都能解析
      {
        find: /^@play-kit\/games\/(.+)$/,
        replacement: resolve(__dirname, '../../packages/games/src/$1'),
      },
      // 根：對 bare import 指到 library barrel
      {
        find: '@play-kit/games',
        replacement: resolve(__dirname, '../../packages/games/src/index.ts'),
      },
    ],
  },
  server: {
    port: 4321,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
