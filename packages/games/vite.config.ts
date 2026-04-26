import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// 自動列出 src/games/* 作為 multi-entry build。
// 每加一款 game 不用改這支 config。
const GAMES_DIR = resolve(__dirname, 'src/games');
const GAME_IDS = readdirSync(GAMES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Multi-entry：主 barrel + 17 款 game + core barrel。
// Sub-path import（@play-kit/games/lucky-wheel）解到對應的 dist/games/<id>/index.js
// → bundler 只把 LuckyWheel 拉進去，其他 16 款不會進 consumer bundle（tree-shake 解放）。
// 主 barrel（@play-kit/games）保留為 full re-export，舊用法不破。
const entry: Record<string, string> = {
  index: resolve(__dirname, 'src/index.ts'),
  'core/index': resolve(__dirname, 'src/core/index.ts'),
  'i18n/index': resolve(__dirname, 'src/i18n/index.ts'),
};
for (const id of GAME_IDS) {
  entry[`games/${id}/index`] = resolve(__dirname, `src/games/${id}/index.ts`);
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Multi-entry：保留 source 1:1 的 d.ts 結構，讓 sub-path import 各自有焦點
      // d.ts（go-to-definition 跳到的檔案小、聚焦於該 game）。Main barrel 仍透過
      // index.d.ts 完整 re-export，full bundle 用法不破。
      rollupTypes: false,
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.*',
        'src/test-setup.ts',
        'src/test-utils.tsx',
      ],
    }),
  ],
  build: {
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false, // 所有 CSS 仍合併到 dist/styles.css；consumer 顯式 import 一次即可
    lib: {
      entry,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: (assetInfo) =>
            assetInfo.name === 'style.css' ? 'styles.css' : (assetInfo.name ?? ''),
          // 共用模組自動切 chunk；不手動 manualChunks 讓 rollup 決定最佳切分
        },
        {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          chunkFileNames: 'chunks/[name]-[hash].cjs',
          assetFileNames: (assetInfo) =>
            assetInfo.name === 'style.css' ? 'styles.css' : (assetInfo.name ?? ''),
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.*',
        'src/index.ts',
        'src/**/index.ts',
        'src/test-setup.ts',
        'src/theme/tokens.ts',
        'src/core/types.ts',
      ],
    },
  },
});
