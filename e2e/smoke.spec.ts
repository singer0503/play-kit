import { expect, test } from '@playwright/test';

/**
 * Smoke 測試：17 款 game 個別跑「能載入、有 region、無 console error」三件事。
 * 每款 game 走自己 hash route：/#<id>。
 *
 * 為什麼用 for-of 動態產生：每款 game 是獨立 test，失敗時報告會明確指出
 * 哪款掛掉，而不是一個 mega-test 塞 17 個 expect。
 */
const GAMES = [
  'lucky-wheel',
  'nine-grid',
  'scratch-card',
  'smash-egg',
  'slot-machine',
  'lotto-roll',
  'gift-box',
  'gift-rain',
  'flip-match',
  'quiz',
  'shake',
  'shake-dice',
  'ring-toss',
  'guess-gift',
  'doll-machine',
  'marquee',
  'daily-checkin',
] as const;

test.describe('smoke: 17 款 game 個別載入', () => {
  for (const id of GAMES) {
    test(`${id} 路由載入後 .pk-game 可見、無 console error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => {
        errors.push(`pageerror: ${err.message}`);
      });

      await page.goto(`/#${id}`, { waitUntil: 'networkidle' });

      // 預覽 tab 預設是 demo（採納 reviewer 反饋）
      const previewTab = page.getByRole('button', { name: /^預覽$|^Preview$/ });
      await expect(previewTab).toHaveAttribute('aria-pressed', 'true');

      // game 元件本體可見
      const gameRegion = page.locator('.pk-game').first();
      await expect(gameRegion).toBeVisible();

      // 沒 console error / page error
      expect(errors, `console errors: \n${errors.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('smoke: 首頁與導航', () => {
  test('首頁載入 + 17 款 game card 全部可見', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // hero
    await expect(page.locator('.docs-hero, .docs-home').first()).toBeVisible();

    // sidebar 17 個 navitem
    const navItems = page.locator('.docs-navitem');
    await expect(navItems).toHaveCount(17);
  });

  test('側邊欄點擊切到不同 game，URL hash 跟著變', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 桌機可見 sidebar；mobile 要先開 drawer
    const w = page.viewportSize()?.width ?? 0;
    const isMobile = w > 0 && w < 900;
    if (isMobile) {
      await page.getByRole('button', { name: /開啟選單|Open menu/ }).click();
    }

    await page.locator('.docs-navitem').first().click();
    await expect(page).toHaveURL(/#[\w-]+$/);
    await expect(page.locator('.pk-game').first()).toBeVisible();
  });
});
