import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

// @play-kit/games 以 library mode 產出 ESM + CJS + 單一 d.ts。
// CSS 由 vite-plugin-lib-inject-css 在各個 chunk 頂端 import，
// 使用者 import 任意 game 都會自動拿到樣式。
export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      rollupTypes: true,
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
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' ? 'styles.css' : (assetInfo.name ?? ''),
      },
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
        // SSR guard 與 defensive fallback 在 jsdom 測不到，branch 門檻適度放寬
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
        // tokens.ts / types.ts 是純常數 / 型別 export，無可測 branch
        'src/theme/tokens.ts',
        'src/core/types.ts',
      ],
    },
  },
});
