import { expect, test } from '@playwright/test';

/**
 * ScratchCard happy path：
 *   1. 進站 → 初始 idle
 *   2. 用 mouse.down + 多次 mouse.move 連續 drag 三條橫線覆蓋 canvas 主要區域
 *   3. 等 progress >= revealThreshold (55%)，state 自動轉 won/lost
 *
 * 為什麼用 3 條橫線：brush 44px、canvas drawing 空間 320×180，每條橫線
 * 清掉 44×320 ≈ 24% 面積；3 條覆蓋 ~70% > 55% threshold，穩定觸發 finalize。
 *
 * 桌機 only：mobile transform: scale 影響 hit-test，drag 軌跡可能偏移，
 * 等 v0.2.0 RWD per-game 完成後再開 mobile e2e。
 */
test.describe('scratch-card happy path', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only — mobile transform 影響 drag 精度');

  test('drag 刮過 → state 由 idle 走到 won/lost', async ({ page }) => {
    await page.goto('/#scratch-card', { waitUntil: 'networkidle' });

    const game = page.locator('.pk-game').first();
    await expect(game).toBeVisible();

    const stateBadge = game.locator('.pk-state-badge');
    await expect(stateBadge).toHaveAttribute('data-state', 'idle');

    const canvas = game.locator('canvas.pk-sc__canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // 三條橫向 drag 覆蓋 canvas 上、中、下三個帶狀區
    for (const yPercent of [0.25, 0.55, 0.85]) {
      const startX = box.x + 8;
      const endX = box.x + box.width - 8;
      const y = box.y + box.height * yPercent;

      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(endX, y, { steps: 25 });
      await page.mouse.up();
    }

    // finalize：state 應在 5 秒內轉到 won 或 lost
    await expect(stateBadge).toHaveAttribute('data-state', /^(won|lost)$/, { timeout: 5000 });
  });
});
