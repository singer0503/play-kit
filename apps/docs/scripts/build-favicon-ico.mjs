#!/usr/bin/env node
// 從 favicon.svg 透過 Playwright 渲染成 32×32 PNG，再包成 PNG-in-ICO
// （所有 modern browser + IE6+ 都接受的 ICO 格式，遠比手刻 BMP-in-ICO 穩）。
//
// 流程：
//   1. Playwright headless chromium 載入 SVG 在白底 wrapper
//   2. screenshot → PNG buffer
//   3. 寫成 ICO 容器（6 byte header + 16 byte entry + PNG 直接 embed）
//
// 為什麼不繼續手刻 BMP DIB：實測 Chrome 拿到後不顯示 favicon
// （globe 圖示），原因可能是 BMP DIB pixel order / AND mask 對齊細節。
// PNG-in-ICO 把 PNG 完整放進 ICO，零位元格式風險。

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, '../public');

const svgContent = readFileSync(resolve(PUBLIC, 'favicon.svg'), 'utf8');

async function svgToPng(size) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1, // 保持 1:1，PNG 寬高 = size
  });
  const page = await ctx.newPage();
  // 把 SVG 直接放進 body，調整成 size×size
  await page.setContent(
    `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
      ${svgContent.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`)}
    </body></html>`,
  );
  const png = await page.screenshot({ omitBackground: true, type: 'png' });
  await browser.close();
  return png;
}

function pngToIco(pngBuffers, sizes) {
  // ICONDIR (6 bytes)
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2); // type = icon
  iconDir.writeUInt16LE(pngBuffers.length, 4);

  // ICONDIRENTRY × N (16 bytes each)
  let offset = 6 + 16 * pngBuffers.length;
  const entries = pngBuffers.map((png, i) => {
    const e = Buffer.alloc(16);
    const size = sizes[i];
    e.writeUInt8(size === 256 ? 0 : size, 0); // width
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // colorCount = 0
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bitCount
    e.writeUInt32LE(png.length, 8); // image size
    e.writeUInt32LE(offset, 12); // offset
    offset += png.length;
    return e;
  });

  return Buffer.concat([iconDir, ...entries, ...pngBuffers]);
}

const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) {
  const png = await svgToPng(s);
  pngs.push(png);
  console.log(`[favicon] rendered ${s}×${s} PNG (${png.length} bytes)`);
}

const ico = pngToIco(pngs, sizes);
writeFileSync(resolve(PUBLIC, 'favicon.ico'), ico);
console.log(`[favicon] wrote favicon.ico (${ico.length} bytes, sizes: ${sizes.join(', ')})`);

// 順手 ship 32x32 PNG，給 <link rel="icon" type="image/png" sizes="32x32"> 用
writeFileSync(resolve(PUBLIC, 'favicon-32.png'), pngs[1]);
console.log(`[favicon] wrote favicon-32.png (${pngs[1].length} bytes)`);
