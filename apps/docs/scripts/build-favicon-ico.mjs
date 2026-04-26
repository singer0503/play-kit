#!/usr/bin/env node
// 從 favicon.svg 同樣的設計，產一份 16x16 + 32x32 的 favicon.ico。
// Pure Node Buffer，沒有外部 deps（無 sharp / canvas）。
//
// ICO 格式：
//   - ICONDIR (6 bytes): reserved + type=1 + count
//   - ICONDIRENTRY (16 bytes × N): 每張圖 metadata
//   - BITMAPINFOHEADER (40 bytes) + 像素 (BGRA) + AND mask
//
// 我們手繪「金方塊 + 對角 path」的 16x16 與 32x32，足夠 small-size 辨識。
// 因為 SVG 主 favicon 在 modern browser 都會優先用，這支 ICO 主要是
// 滿足 /favicon.ico 直接 URL 請求 + 老 browser fallback。

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, '../public');

// 顏色（BGRA 順序，跟 ICO 的 BMP DIB 一致）
const GOLD = [0x69, 0xc4, 0xe0, 0xff]; // B G R A — #e0c469
const DARK = [0x2a, 0x17, 0x16, 0xff]; // #16172a
const ALPHA0 = [0, 0, 0, 0]; // 完全透明

// 設計：圓角方塊 + check 路徑。回傳 BGRA Uint8Array (size*size*4)
function renderIcon(size) {
  const px = new Uint8Array(size * size * 4);
  const r = Math.round(size * 0.25); // 圓角半徑
  const margin = Math.round(size * 0.0625); // 約 6% margin

  // helper: 畫 path 用的線寬（依 size 縮放）
  const stroke = Math.max(1, Math.round(size * 0.094));

  // path 控制點（相對於原 SVG viewBox 32x32 的座標換算到 size）
  const s = size / 32;
  const path = [
    [10 * s, 16 * s],
    [14 * s, 20 * s],
    [22 * s, 12 * s],
  ];

  function setPx(x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    // ICO BMP 是 bottom-up（最後一列在前）
    const yy = size - 1 - y;
    const idx = (yy * size + x) * 4;
    px[idx] = color[0];
    px[idx + 1] = color[1];
    px[idx + 2] = color[2];
    px[idx + 3] = color[3];
  }

  // 1. 圓角金方塊背景
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xi = x - margin;
      const yi = y - margin;
      const w = size - 2 * margin;
      const h = w;
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue;
      // 圓角測試
      let inside = true;
      const corners = [
        [r, r],
        [w - 1 - r, r],
        [r, h - 1 - r],
        [w - 1 - r, h - 1 - r],
      ];
      const inCornerBox =
        (xi < r && yi < r) ||
        (xi >= w - r && yi < r) ||
        (xi < r && yi >= h - r) ||
        (xi >= w - r && yi >= h - r);
      if (inCornerBox) {
        let nearest = corners[0];
        if (xi >= w - r && yi < r) nearest = corners[1];
        else if (xi < r && yi >= h - r) nearest = corners[2];
        else if (xi >= w - r && yi >= h - r) nearest = corners[3];
        const dx = xi - nearest[0];
        const dy = yi - nearest[1];
        if (dx * dx + dy * dy > r * r) inside = false;
      }
      if (inside) setPx(x, y, GOLD);
    }
  }

  // 2. check 路徑：兩段直線粗線
  function drawLine(x1, y1, x2, y2, color, w) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist * 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      // 粗線：在中心點周圍 w/2 半徑內塗色
      const half = w / 2;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          if (dx * dx + dy * dy <= half * half) {
            setPx(Math.round(cx + dx), Math.round(cy + dy), color);
          }
        }
      }
    }
  }
  drawLine(path[0][0], path[0][1], path[1][0], path[1][1], DARK, stroke);
  drawLine(path[1][0], path[1][1], path[2][0], path[2][1], DARK, stroke);

  return px;
}

// AND mask（單色透明遮罩，每行 4-byte aligned）
function buildAndMask(size, pixels) {
  const rowBytes = Math.max(4, Math.ceil(size / 32) * 4); // 4-byte aligned
  const mask = new Uint8Array(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const yy = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const idx = (yy * size + x) * 4;
      const alpha = pixels[idx + 3];
      if (alpha === 0) {
        // bit = 1 表示透明
        const byteIdx = yy * rowBytes + Math.floor(x / 8);
        mask[byteIdx] |= 0x80 >> (x % 8);
      }
    }
  }
  return mask;
}

function buildIconImage(size) {
  const xor = renderIcon(size);
  const and = buildAndMask(size, xor);

  // BITMAPINFOHEADER (40 bytes)
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(size, 4); // biWidth
  bih.writeInt32LE(size * 2, 8); // biHeight = double（XOR + AND）
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(0, 20); // biSizeImage
  // 其他全 0

  return Buffer.concat([bih, Buffer.from(xor), Buffer.from(and)]);
}

const sizes = [16, 32];
const images = sizes.map(buildIconImage);

// ICONDIR (6 bytes)
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0); // reserved
iconDir.writeUInt16LE(1, 2); // type = icon
iconDir.writeUInt16LE(sizes.length, 4); // count

// ICONDIRENTRY × N (16 bytes each)
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width
  e.writeUInt8(size === 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // colorCount
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bitCount
  e.writeUInt32LE(images[i].length, 8); // image size
  e.writeUInt32LE(offset, 12); // offset
  offset += images[i].length;
  return e;
});

const ico = Buffer.concat([iconDir, ...entries, ...images]);
writeFileSync(resolve(PUBLIC, 'favicon.ico'), ico);
console.log(`[favicon] wrote favicon.ico (${ico.length} bytes, sizes: ${sizes.join(', ')})`);
