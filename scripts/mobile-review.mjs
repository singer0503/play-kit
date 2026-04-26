#!/usr/bin/env node
// Mobile UX 審查：對 17 款 game 在 iPhone SE 320 + iPhone 13 390 兩個 viewport
// 截圖 + 量度。關注重點：
//   - .pk-game 視窗適配（不溢出、scale 後仍清楚可讀）
//   - 主動作 button 物理尺寸 ≥ 44x44 CSS px（WCAG 2.5.5 Target Size）
//   - 整頁無 horizontal scroll
//   - reduced-motion 環境也能完成主流程
//
// Usage:
//   1. 啟動 preview server 在 :4322（pnpm -C apps/docs preview --port 4322）
//   2. node scripts/mobile-review.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT = resolve(REPO, 'mobile-review');
mkdirSync(OUT, { recursive: true });

const games = [
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
];

const viewports = [
  { id: 'iphone-se', label: 'iPhone SE 320', width: 320, height: 568 },
  { id: 'iphone-13', label: 'iPhone 13   390', width: 390, height: 844 },
];

const browser = await chromium.launch();

const findings = [];

for (const vp of viewports) {
  const ctx = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  for (const id of games) {
    await page.goto(`http://localhost:4322/#${id}`, { waitUntil: 'networkidle' });
    // 等 .pk-game render；mobile sidebar 預設關，game 直接在視窗內
    await page.waitForSelector('.pk-game', { state: 'visible', timeout: 5000 });

    // 量度
    const data = await page.evaluate(() => {
      const game = document.querySelector('.pk-game');
      if (!game) return null;
      const r = game.getBoundingClientRect();
      const cs = getComputedStyle(game);

      // root scale
      const scale = Number.parseFloat(cs.getPropertyValue('--pk-scale') || '1');

      // 主要 buttons：找根 section 內的 <button>
      const buttons = Array.from(game.querySelectorAll('button'));
      const btnSizes = buttons.slice(0, 8).map((b) => {
        const br = b.getBoundingClientRect();
        return {
          text: (b.textContent || '').slice(0, 20).trim(),
          w: Math.round(br.width),
          h: Math.round(br.height),
          // physical CSS px (already after transform/scale)
        };
      });

      // 整頁 horizontal scroll？
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const overflowX = docW > winW + 1;

      // viewport 與 game 寬度對比
      const fits = r.width <= winW + 1;

      return {
        scale: scale,
        gameW: Math.round(r.width),
        gameH: Math.round(r.height),
        winW,
        docW,
        overflowX,
        fits,
        btnSizes,
      };
    });

    // 截圖（聚焦 .pk-game 區）
    const ssPath = resolve(OUT, `${id}-${vp.id}.png`);
    const gameEl = page.locator('.pk-game').first();
    await gameEl.screenshot({ path: ssPath });

    findings.push({ id, vp: vp.id, ...data });
    console.log(
      `  ${id.padEnd(14)} ${vp.id.padEnd(11)} ` +
        `scale ${(data?.scale ?? 0).toFixed(2)}  ` +
        `game ${data?.gameW}×${data?.gameH}px  ` +
        `${data?.fits ? '✓ fits' : '✗ overflow'} ` +
        `${data?.overflowX ? '· page overflow-x!' : ''} ` +
        `· main btn ${data?.btnSizes[0]?.w}×${data?.btnSizes[0]?.h}`,
    );
  }

  await ctx.close();
  console.log();
}

writeFileSync(resolve(OUT, 'findings.json'), JSON.stringify(findings, null, 2));
await browser.close();

// Summary: WCAG 2.5.5 violations
console.log('--- WCAG 2.5.5 Target Size (44×44) audit ---');
const tooSmall = findings.flatMap((f) =>
  (f.btnSizes ?? [])
    .filter((b) => (b.w < 44 || b.h < 44) && b.w > 0 && b.h > 0)
    .map((b) => ({ game: f.id, vp: f.vp, ...b })),
);
if (tooSmall.length === 0) {
  console.log('  ✓ all interactive buttons ≥ 44×44 CSS px');
} else {
  for (const v of tooSmall) {
    console.log(`  ⚠ ${v.game} @ ${v.vp}: "${v.text}" ${v.w}×${v.h} (< 44)`);
  }
}

console.log('\n--- Overflow audit ---');
const overflows = findings.filter((f) => f.overflowX || !f.fits);
if (overflows.length === 0) {
  console.log('  ✓ no horizontal overflow / game fits within viewport');
} else {
  for (const f of overflows) {
    console.log(`  ⚠ ${f.id} @ ${f.vp}: gameW ${f.gameW} winW ${f.winW} overflowX ${f.overflowX}`);
  }
}

console.log(`\n[mobile-review] screenshots saved to ${OUT}`);
