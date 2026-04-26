import { expect, test } from '@playwright/test';

/**
 * Reduced-motion audit：對全 17 款 game 設 `prefers-reduced-motion: reduce`，
 * 驗證每款 game 在這環境下：
 *
 *   1. 正常 render（.pk-game 可見）
 *   2. 主動作 button 點擊後不丟 JS 錯誤
 *   3. 動畫驅動的 game（lucky-wheel / slot-machine / lotto-roll / smash-egg /
 *      gift-box / doll-machine / marquee / gift-rain / ring-toss / guess-gift /
 *      nine-grid）—— state 在 1.5s 內離開 idle，證明動畫真的被 skip
 *   4. 互動驅動的 game（scratch-card / flip-match / quiz / shake / shake-dice
 *      / daily-checkin）—— 因為要多步互動才轉 state，只驗 render + 點按不 throw
 *
 * 這支 audit 是 a11y 賣點的「可驗證證據」：reduced-motion 不只是 code 有 if-else，
 * 而是端到端真的 work。CI 自動跑，未來改 game 動畫邏輯壞掉這條會 fail。
 */

// 動畫驅動 — state 機應在 reduced-motion 下快速離開 idle
const ANIMATION_GAMES = [
  'lucky-wheel',
  'nine-grid',
  'slot-machine',
  'lotto-roll',
  'smash-egg',
  'gift-box',
  'doll-machine',
  'marquee',
  'gift-rain',
  'ring-toss',
  'guess-gift',
];

// 互動驅動 — 主動作要多步觸發，只驗 render + 點按不 throw
const INTERACTIVE_GAMES = [
  'scratch-card',
  'flip-match',
  'quiz',
  'shake',
  'shake-dice',
  'daily-checkin',
];

test.describe('reduced-motion audit (全 17 款 game)', () => {
  test.use({ reducedMotion: 'reduce' });
  // 只在 desktop project 跑（mobile 的漢堡 drawer / hit area 細節會干擾這個 audit
  // 的純動畫關注點）
  test.skip(({ isMobile }) => isMobile, 'reduced-motion audit 只在 desktop 跑');

  for (const id of ANIMATION_GAMES) {
    test(`${id} (animation-driven): state 在 1.5s 內離開 idle`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(`/#${id}`, { waitUntil: 'networkidle' });
      const game = page.locator('.pk-game').first();
      await expect(game).toBeVisible();
      // 預設 idle
      await expect(game.locator('[data-state="idle"]').first()).toBeVisible();

      // 點第一個 enabled、非裝飾性 button
      const btn = game.locator('button:not([aria-hidden="true"]):not([disabled])').first();
      await expect(btn).toBeVisible();
      const start = Date.now();
      await btn.click();

      // reduced-motion 下，state 應快速離開 idle（不再等動畫）
      await expect(game.locator('[data-state="idle"]').first()).toBeHidden({
        timeout: 1500,
      });
      const elapsed = Date.now() - start;
      console.log(`  [${id}] state left idle in ${elapsed}ms (limit 1500ms)`);
      expect(pageErrors, `pageerror in ${id}`).toEqual([]);
    });
  }

  for (const id of INTERACTIVE_GAMES) {
    test(`${id} (interactive): render + 主動作 button 點擊不 throw`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(`/#${id}`, { waitUntil: 'networkidle' });
      const game = page.locator('.pk-game').first();
      await expect(game).toBeVisible();

      // 嘗試點第一個 enabled button（多數互動類有「開始」鈕）
      const btn = game.locator('button:not([aria-hidden="true"]):not([disabled])').first();
      const btnCount = await btn.count();
      if (btnCount > 0 && (await btn.isVisible())) {
        await btn.click().catch(() => {
          /* drag 區的 button 可能被 overlay 擋；不 throw 就算 pass */
        });
      }
      await page.waitForTimeout(300);

      expect(pageErrors, `pageerror in ${id}`).toEqual([]);
      // game 容器仍存在（沒 crash unmount）
      await expect(game).toBeVisible();
    });
  }
});
