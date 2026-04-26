import { expect, test } from '@playwright/test';

/**
 * Mobile 專用：sidebar drawer 行為 + tab 預設回 demo。
 * 只在 mobile-iphone-12 project 跑。
 */
test.describe('mobile: 漢堡 drawer + tab 預設', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only specs');

  test('漢堡按鈕開抽屜 + backdrop 關閉', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 桌機 sidebar 是 grid，mobile 是 fixed translateX(-100%) 隱藏
    const shell = page.locator('.docs-shell');
    await expect(shell).not.toHaveClass(/docs-shell--open/);

    // 點漢堡 → docs-shell--open class 加上
    await page.getByRole('button', { name: /開啟選單|Open menu/ }).click();
    await expect(shell).toHaveClass(/docs-shell--open/);

    // backdrop 出現
    const backdrop = page.locator('.docs-shell__backdrop');
    await expect(backdrop).toBeVisible();

    // 點 backdrop → 關
    await backdrop.click();
    await expect(shell).not.toHaveClass(/docs-shell--open/);
  });

  test('drawer 內點 game → URL 跳 + drawer 自動關', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /開啟選單|Open menu/ }).click();
    await page.locator('.docs-navitem').first().click();

    await expect(page).toHaveURL(/#[\w-]+$/);
    await expect(page.locator('.docs-shell')).not.toHaveClass(/docs-shell--open/);
  });

  test('ESC 關 drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /開啟選單|Open menu/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.docs-shell')).not.toHaveClass(/docs-shell--open/);
  });
});

test.describe('tab 預設回預覽（採納 reviewer 反饋）', () => {
  test('切到程式碼 tab 後切 game，新 game 預設回預覽', async ({ page }) => {
    await page.goto('/#lucky-wheel', { waitUntil: 'networkidle' });

    // 切到程式碼 tab
    const codeTab = page.getByRole('button', { name: /^程式碼$|^Code$/ });
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-pressed', 'true');

    // 從 sidebar 跳到下一款（mobile 先開抽屜，desktop 直接點）
    const w = page.viewportSize()?.width ?? 0;
    const isMobile = w > 0 && w < 900;
    if (isMobile) {
      await page.getByRole('button', { name: /開啟選單|Open menu/ }).click();
    }
    // 跳到第二款 game
    await page.locator('.docs-navitem').nth(1).click();

    // 新 game 上的預覽 tab 應該是 active
    const previewTab = page.getByRole('button', { name: /^預覽$|^Preview$/ });
    await expect(previewTab).toHaveAttribute('aria-pressed', 'true');
  });
});
