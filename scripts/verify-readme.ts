// check:readme — assert README「事件回呼簽章對照」表 vs *Props interface 對齊。
// 防的 bug：0.2.x 期間 17 款裡 12 款 onWin 簽章 README 寫錯，按表抄會 tsc fail。
// 0.3.0 已修齊，此 script 防未來 drift 復發（新加 game 忘記同步 README 時 CI fail）。

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from 'ts-morph';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const README_PATH = resolve(ROOT, 'README.md');
const GAMES_ROOT = resolve(ROOT, 'packages/games/src/games');

function pascalToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (_, c) => `-${c.toLowerCase()}`).replace(/^-/, '');
}

function normalize(sig: string): string {
  return sig
    .replace(/^`|`$/g, '') // 去 markdown backtick
    .replace(/=>\s*void\s*$/, '') // 去 trailing => void
    .replace(/\s+/g, '') // 收空白
    .trim();
}

interface ReadmeRow {
  game: string;
  onWin: string;
  onClaim: string;
  line: number;
}

function parseReadmeTable(): ReadmeRow[] {
  const lines = readFileSync(README_PATH, 'utf8').split('\n');
  const startIdx = lines.findIndex((l) => l.includes('事件回呼簽章對照'));
  if (startIdx < 0) throw new Error('README 找不到「事件回呼簽章對照」段落');

  const rows: ReadmeRow[] = [];
  // 從段落開始往下掃 ~50 行，遇空行或下個 section 就停
  for (let i = startIdx; i < Math.min(startIdx + 60, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith('## ') && i > startIdx + 1) break;
    // 行格式：| `GameName` | `(...)` | `(...)` | comment? |
    const m = line.match(/^\|\s*`(\w+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const game = m[1] ?? '';
    const onWin = (m[2] ?? '').trim();
    const onClaim = (m[3] ?? '').trim();
    if (!game) continue;
    rows.push({ game, onWin, onClaim, line: i + 1 });
  }
  return rows;
}

interface InterfaceSig {
  onWin: string | null;
  onClaim: string | null;
}

const project = new Project({
  tsConfigFilePath: resolve(ROOT, 'packages/games/tsconfig.json'),
});

function readInterfaceSig(gameName: string): InterfaceSig {
  const id = pascalToKebab(gameName);
  const path = resolve(GAMES_ROOT, id, 'types.ts');
  const sf = project.addSourceFileAtPath(path);
  const ifaceName = `${gameName}Props`;
  const iface = sf.getInterface(ifaceName);
  if (!iface) {
    throw new Error(`interface ${ifaceName} not found in ${path}`);
  }
  const getSig = (prop: string): string | null => {
    const p = iface.getProperty(prop);
    if (!p) return null;
    // getTypeNode() 拿源碼原樣（保留 LuckyWheelPrize 不展開 import 路徑）；
    // getType().getText() 會把型別 resolve 成 fully-qualified import("...").Foo。
    const node = p.getTypeNode();
    const text = node ? node.getText() : p.getType().getText();
    return text.replace(/\s*\|\s*undefined\s*$/, '');
  };
  return {
    onWin: getSig('onWin'),
    onClaim: getSig('onClaim'),
  };
}

const ABSENT_TOKENS = new Set(['—', '-', '–', '']);
function isAbsent(readme: string): boolean {
  const stripped = readme.replace(/^`|`$/g, '').trim();
  return ABSENT_TOKENS.has(stripped);
}

const readmeRows = parseReadmeTable();
let hadError = false;

console.log(`[info] README events table: ${readmeRows.length} rows`);

function checkField(
  game: string,
  field: 'onWin' | 'onClaim',
  readmeSig: string,
  ifaceSig: string | null,
  line: number,
): boolean {
  const rAbsent = isAbsent(readmeSig);
  const iAbsent = ifaceSig === null;

  if (rAbsent && iAbsent) return true;
  if (rAbsent && !iAbsent) {
    console.log(`[error] L${line} ${game}.${field}: README 標 "—" 但 interface 有 \`${ifaceSig}\``);
    return false;
  }
  if (!rAbsent && iAbsent) {
    console.log(
      `[error] L${line} ${game}.${field}: README 寫 \`${readmeSig}\` 但 interface 無此 member`,
    );
    return false;
  }
  const a = normalize(readmeSig);
  const b = normalize(ifaceSig as string);
  if (a !== b) {
    console.log(
      `[error] L${line} ${game}.${field}: README \`${readmeSig}\` ≠ d.ts \`${ifaceSig}\``,
    );
    return false;
  }
  return true;
}

for (const r of readmeRows) {
  let iface: InterfaceSig;
  try {
    iface = readInterfaceSig(r.game);
  } catch (err) {
    hadError = true;
    console.log(`[error] L${r.line} ${r.game}: ${(err as Error).message}`);
    continue;
  }
  const okWin = checkField(r.game, 'onWin', r.onWin, iface.onWin, r.line);
  const okClaim = checkField(r.game, 'onClaim', r.onClaim, iface.onClaim, r.line);
  if (!okWin || !okClaim) hadError = true;
}

if (hadError) {
  console.log('[error] check:readme 失敗。請更新 README 表或 *Props interface。');
  process.exit(1);
}
console.log(`[info] check:readme 通過。${readmeRows.length} 款 game onWin/onClaim 簽章對齊。`);
