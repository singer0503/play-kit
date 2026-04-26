#!/usr/bin/env node
// 對 published（或本地 pack 的）@play-kit/games tarball 做端對端 smoke test。
//
// 動機：0.2.0 published artifact 在純 Node CJS 會 SyntaxError（CJS bundle 第一行
// require('./index.css')，Node 沒有 CSS loader），但 unit test / typecheck / SSR 檢查
// 都用 source 跑，全部漏抓。這個 script 改用真實 npm pack 出的 tarball 走完整 install
// → CJS require / ESM import / CSS subpath / SSR renderToString，杜絕同類 bug 復發。
//
// Usage:
//   node scripts/smoke-published.mjs                      # 預設：npm pack 本地 packages/games，測 tarball
//   node scripts/smoke-published.mjs --from-npm           # 測 npm registry latest
//   node scripts/smoke-published.mjs --from-npm=0.2.1     # 測指定版本
//
// 退出碼：0 = 全 pass；非 0 = 有 fail。

import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PKG_DIR = resolve(REPO, 'packages/games');

const fromNpmArg = process.argv.find((a) => a.startsWith('--from-npm'));
const fromNpm = fromNpmArg !== undefined;
const explicitVersion = fromNpmArg?.includes('=') ? fromNpmArg.split('=')[1] : '';

const passes = [];
const fails = [];

async function check(name, fn) {
  try {
    await fn();
    passes.push(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    fails.push({ name, msg });
    console.log(`  ✗ ${name}\n      ${msg.split('\n')[0]}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const TEMP = mkdtempSync(join(tmpdir(), 'pk-smoke-'));
let tarballToCleanup = '';

try {
  console.log(`[smoke] temp dir: ${TEMP}`);

  // ----- prepare install spec -----
  let installSpec;
  if (fromNpm) {
    installSpec = explicitVersion ? `@play-kit/games@${explicitVersion}` : '@play-kit/games@latest';
    console.log(`[smoke] mode: install from npm (${installSpec})`);
  } else {
    console.log('[smoke] mode: pack local packages/games');
    const packOut = execSync('npm pack --json', { cwd: PKG_DIR, encoding: 'utf8' });
    const packed = JSON.parse(packOut)[0];
    tarballToCleanup = resolve(PKG_DIR, packed.filename);
    installSpec = tarballToCleanup;
    console.log(`[smoke] packed: ${packed.filename} (${packed.size} bytes)`);
  }

  // ----- install -----
  execSync('npm init -y', { cwd: TEMP, stdio: 'pipe' });
  console.log('[smoke] installing into temp dir...');
  execSync(`npm i "${installSpec}" react react-dom`, { cwd: TEMP, stdio: 'pipe' });

  const tempRequire = createRequire(join(TEMP, 'package.json'));
  const installedPkg = tempRequire('@play-kit/games/package.json');
  console.log(`\n[smoke] testing @play-kit/games@${installedPkg.version}\n`);

  // ----- 1. metadata -----
  await check('1. installed metadata', () => {
    assert(installedPkg.name === '@play-kit/games', `name mismatch: ${installedPkg.name}`);
    if (explicitVersion) {
      assert(
        installedPkg.version === explicitVersion,
        `version mismatch: got ${installedPkg.version}, want ${explicitVersion}`,
      );
    }
    const exports = Object.keys(installedPkg.exports ?? {});
    assert(exports.includes('.'), 'missing root export');
    assert(exports.includes('./styles.css'), 'missing ./styles.css export');
  });

  // ----- 2. CJS require — the 0.2.0 failure case -----
  await check('2. CJS require — 17 games + core API present', () => {
    const m = tempRequire('@play-kit/games');
    const games = [
      'LuckyWheel',
      'NineGrid',
      'ScratchCard',
      'SmashEgg',
      'SlotMachine',
      'LottoRoll',
      'GiftBox',
      'GiftRain',
      'FlipMatch',
      'Quiz',
      'Shake',
      'ShakeDice',
      'RingToss',
      'GuessGift',
      'DollMachine',
      'Marquee',
      'DailyCheckin',
    ];
    const missing = games.filter((g) => !(g in m));
    assert(missing.length === 0, `missing games: ${missing.join(',')}`);
    assert(typeof m.PlayKitProvider === 'function', `PlayKitProvider not function: ${typeof m.PlayKitProvider}`);
    assert(typeof m.useGameScale === 'function', 'useGameScale not function');
    assert(typeof m.useScalePolicy === 'function', 'useScalePolicy not function');
    assert(typeof m.useReducedMotion === 'function', 'useReducedMotion not function');
    assert(
      Array.isArray(m.GAME_STATES) && m.GAME_STATES.length === 6,
      `GAME_STATES not 6-state array (got ${JSON.stringify(m.GAME_STATES)})`,
    );
  });

  // ----- 3. ESM dynamic import -----
  const esmEntry =
    installedPkg.exports?.['.']?.import ?? installedPkg.module ?? installedPkg.main ?? './dist/index.js';
  const pkgRoot = dirname(tempRequire.resolve('@play-kit/games/package.json'));
  const esmAbsPath = resolve(pkgRoot, esmEntry);
  await check('3. ESM dynamic import — components + hooks present', async () => {
    const esmMod = await import(pathToFileURL(esmAbsPath).href);
    assert(typeof esmMod.LuckyWheel !== 'undefined', 'LuckyWheel missing in ESM');
    assert(typeof esmMod.PlayKitProvider === 'function', 'PlayKitProvider missing in ESM');
    assert(typeof esmMod.useGameScale === 'function', 'useGameScale missing in ESM');
    assert(
      Array.isArray(esmMod.GAME_STATES) && esmMod.GAME_STATES.length === 6,
      'GAME_STATES missing in ESM',
    );
  });

  // ----- 4. CSS subpath -----
  await check('4. ./styles.css subpath resolves to real file', () => {
    const cssPath = tempRequire.resolve('@play-kit/games/styles.css');
    const stat = statSync(cssPath);
    assert(stat.isFile(), 'styles.css is not a file');
    assert(stat.size > 10000, `styles.css suspiciously small: ${stat.size} bytes`);
    const content = readFileSync(cssPath, 'utf8');
    assert(content.includes('--pk-px'), 'styles.css missing --pk-px var (theme tokens not bundled?)');
    assert(content.includes('.pk-game'), 'styles.css missing .pk-game root selector');
  });

  // ----- 5. JS bundles have zero .css references — regression test for 0.2.0 bug -----
  await check('5. JS bundles have zero .css references', () => {
    const cjsPath = tempRequire.resolve('@play-kit/games');
    const cjsContent = readFileSync(cjsPath, 'utf8');
    const cjsHits = (cjsContent.match(/\.css/g) ?? []).length;
    assert(
      cjsHits === 0,
      `dist CJS contains ${cjsHits} ".css" references (this is the 0.2.0 bug — Node CJS will SyntaxError)`,
    );
    const esmContent = readFileSync(esmAbsPath, 'utf8');
    const esmHits = (esmContent.match(/\.css/g) ?? []).length;
    assert(esmHits === 0, `dist ESM contains ${esmHits} ".css" references`);
  });

  // ----- 6. SSR renderToString — end-to-end -----
  // 子程序執行避免污染 smoke script 自己的 ESM resolver
  const ssrCode = `
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
const prizes = [
  { label: '$100', win: true,  weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$50',  win: true,  weight: 2 },
  { label: 'Miss', win: false, weight: 4 },
];
const html = renderToString(
  createElement(PlayKitProvider, { lang: 'zh-TW', theme: 'nocturne' },
    createElement(LuckyWheel, { prizes, maxPlays: 3 })
  )
);
process.stdout.write(html);
`;
  const ssrOut = spawnSync('node', ['--input-type=module', '-e', ssrCode], {
    cwd: TEMP,
    encoding: 'utf8',
  });
  await check('6. SSR renderToString — full LuckyWheel HTML', () => {
    assert(
      ssrOut.status === 0,
      `SSR child process exit ${ssrOut.status}: ${ssrOut.stderr.slice(0, 500)}`,
    );
    const html = ssrOut.stdout;
    assert(html.length > 1000, `HTML too short: ${html.length} chars`);
    assert(html.includes('pk-game'), 'missing pk-game root class');
    assert(html.includes('aria-label'), 'missing aria-label');
    assert(html.includes('data-theme="nocturne"'), 'missing data-theme="nocturne"');
    assert(
      html.includes('幸運轉盤') || html.includes('Lucky Wheel'),
      'missing i18n title (zh-TW/en)',
    );
  });
} finally {
  try {
    rmSync(TEMP, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  if (tarballToCleanup) {
    try {
      rmSync(tarballToCleanup);
    } catch {
      /* ignore */
    }
  }
}

console.log(`\n[smoke] ${passes.length}/${passes.length + fails.length} passed`);
if (fails.length > 0) {
  console.log('[smoke] failures:');
  for (const { name, msg } of fails) {
    console.log(`  - ${name}\n      ${msg}`);
  }
  process.exit(1);
}
process.exit(0);
