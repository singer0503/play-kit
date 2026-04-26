import { defineConfig } from 'vitest/config';

// 工作區根層級的 Vitest 設定：各 package 可 extend 此檔
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
  },
});
