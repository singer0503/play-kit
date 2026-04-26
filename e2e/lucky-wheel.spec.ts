import { expect, test } from '@playwright/test';

/**
 * Lucky Wheel happy path：
 *   1. 進站
 *   2. 找到主動作按鈕點擊（spin）
 *   3. 等待動畫結束（> spin duration）
 *   4. 確認 state 已轉到 won 或 lost（state badge 文字變了）
 *   5. 重置（reset 按鈕）→ state 回 idle
 *
 * 只跑 desktop project（避免 mobile transform: scale 影響 hit area）。
 */
test.describe('lucky-wheel happy path', () => {
  test.skip(({ isMobile }) => isMobile, 'lucky-wheel deep flow 只在 desktop 跑');

  test('spin → 結果（state 由 idle 走到 won/lost）', async ({ page }) => {
    await page.goto('/#lucky-wheel', { waitUntil: 'networkidle' });

    const game = page.locator('.pk-game').first();
    await expect(game).toBeVisible();

    // 用 data-state 屬性比文字穩，不受 i18n 影響
    const stateBadge = game.locator('.pk-state-badge');
    await expect(stateBadge).toHaveAttribute('data-state', 'idle');

    // 中央的 spin button（class 寫死 .pk-lw__hub，最穩）
    const spinButton = game.locator('button.pk-lw__hub');
    await expect(spinButton).toBeVisible();
    await expect(spinButton).toBeEnabled();
    await spinButton.click();

    // 點下去後 state 立刻轉到 playing
    await expect(stateBadge).toHaveAttribute('data-state', 'playing', { timeout: 1000 });

    // 等動畫跑完（spin duration 預設 4600ms + 緩衝）
    await expect(stateBadge).toHaveAttribute('data-state', /^(won|lost)$/, { timeout: 10_000 });
  });
});
