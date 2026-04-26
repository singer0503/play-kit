import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config — 對 docs site 跑 end-to-end 測試。
 *
 * 跑法：
 *   pnpm e2e:build    # 先 build lib + docs（一次性）
 *   pnpm e2e          # 跑全部 spec
 *   pnpm e2e --ui     # 互動式 UI 模式（debug 用）
 *   pnpm e2e --grep mobile    # 只跑 mobile 相關
 *
 * Reports：
 *   - test-results/        測試 artifacts（trace / video / screenshot）
 *   - playwright-report/   HTML report，跑完用 `npx playwright show-report` 看
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      // 用 chromium 跑 iPhone 12 視窗 / touch / DPR emulation，
      // 避免額外裝 WebKit。對「視窗 + touch」相關測試 95% 等效，
      // 真正要驗 Safari render quirks 才需要 WebKit。
      name: 'mobile-iphone-12',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'pnpm -C apps/docs preview --port 4322 --strictPort',
    port: 4322,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
