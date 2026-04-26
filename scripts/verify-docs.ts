// check:docs — 確保 apps/docs/src/registry.ts 的 props metadata
// 與 packages/games 中的 *Props interface 對齊。
// 任何「types.ts 有但 docs 沒列」或「docs 列了但 types.ts 沒有」都 exit 1。

import { readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression } from 'ts-morph';

interface GameCheck {
  id: string;
  interfaceName: string;
  typesPath: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REGISTRY_PATH = resolve(ROOT, 'apps/docs/src/registry.ts');
const GAMES_ROOT = resolve(ROOT, 'packages/games/src/games');

// slug 命名慣例：kebab-case → PascalCase + 'Props'（lucky-wheel → LuckyWheelProps）
function slugToInterface(slug: string): string {
  const pascal = slug
    .split('-')
    .map((seg) => {
      const first = seg[0];
      return first ? first.toUpperCase() + seg.slice(1) : '';
    })
    .join('');
  return `${pascal}Props`;
}

// 自 packages/games/src/games/ 掃子目錄，每款 game 推斷 interface 名稱
function discoverGames(): GameCheck[] {
  return readdirSync(GAMES_ROOT)
    .filter((name) => {
      const full = `${GAMES_ROOT}/${name}`;
      return statSync(full).isDirectory();
    })
    .sort()
    .map((id) => ({
      id,
      interfaceName: slugToInterface(id),
      typesPath: `${GAMES_ROOT}/${id}/types.ts`,
    }));
}

const games: GameCheck[] = discoverGames();

const project = new Project({
  tsConfigFilePath: resolve(ROOT, 'packages/games/tsconfig.json'),
});

let hadError = false;

function log(level: 'info' | 'warn' | 'error', msg: string) {
  const prefix = { info: '[info]', warn: '[warn]', error: '[error]' }[level];
  console.log(`${prefix} ${msg}`);
}

// BaseGameProps 繼承自 React.HTMLAttributes 的 HTML passthrough 不列入 docs 表
// （否則每款 game 都得複製一批 aria-* / data-* / role / tabIndex / ...）。
// 這些是組件庫標配行為，對使用者可預期。
const IGNORED_PROPS = new Set<string>(['id', 'style', 'role', 'tabIndex', 'hidden', 'lang', 'dir']);
function isIgnoredProp(name: string): boolean {
  if (IGNORED_PROPS.has(name)) return true;
  if (name.startsWith('data-')) return true;
  // `aria-label` 是有明確語意（覆寫容器 label）的 API，保留於 docs；其餘 aria-* 為繼承噪音
  if (name.startsWith('aria-') && name !== 'aria-label') return true;
  return false;
}

function collectProps(typesFile: string, interfaceName: string): Set<string> {
  const sf = project.addSourceFileAtPath(typesFile);
  const iface = sf.getInterface(interfaceName);
  if (!iface) {
    throw new Error(`interface ${interfaceName} not found in ${typesFile}`);
  }
  return new Set(
    iface
      .getType()
      .getProperties()
      .map((p) => p.getName())
      .filter((n) => !isIgnoredProp(n)),
  );
}

// 從 ArrayLiteralExpression 遞迴收集所有 object literal 的 `name` 欄位。
// 支援 `...IDENTIFIER` spread，遞迴解析 spread 目標變數的 ArrayLiteral
// （因此 `[...BASE, ...CREATE_REMAINING(3)]` 的 nested spread 亦可追蹤）。
function collectNamesFromArray(arr: ArrayLiteralExpression, names: Set<string>): void {
  for (const rowExpr of arr.getElements()) {
    if (rowExpr.getKind() === SyntaxKind.SpreadElement) {
      const spread = rowExpr.asKindOrThrow(SyntaxKind.SpreadElement);
      const ident = spread.getExpression();
      if (ident.getKind() !== SyntaxKind.Identifier) continue;
      const symbol = ident.getSymbol();
      const decl = symbol?.getDeclarations()[0];
      if (!decl) continue;
      const varDecl = decl.asKind(SyntaxKind.VariableDeclaration);
      if (!varDecl) continue;
      const initExpr = varDecl.getInitializer();
      if (!initExpr) continue;
      const arr2 = initExpr.asKind(SyntaxKind.ArrayLiteralExpression);
      if (!arr2) continue;
      collectNamesFromArray(arr2, names);
      continue;
    }
    if (rowExpr.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
    const row = rowExpr.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const nameP = row.getProperty('name');
    if (!nameP) continue;
    const n = nameP
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getInitializerIfKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralText();
    names.add(n);
  }
}

function collectRegistryProps(): Map<string, Set<string>> {
  const sf = project.addSourceFileAtPath(REGISTRY_PATH);
  const registryDecl = sf.getVariableDeclaration('registry');
  if (!registryDecl) throw new Error('registry array not found');
  const init = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

  const out = new Map<string, Set<string>>();
  for (const el of init.getElements()) {
    // 兼容直接 object literal 與 defineGame({...}) 呼叫
    let obj: ReturnType<typeof init.asKindOrThrow<SyntaxKind.ObjectLiteralExpression>> | null =
      null;
    if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
      obj = el.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    } else if (el.getKind() === SyntaxKind.CallExpression) {
      const call = el.asKindOrThrow(SyntaxKind.CallExpression);
      const args = call.getArguments();
      if (args.length === 0) continue;
      const first = args[0];
      if (!first || first.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
      obj = first.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    }
    if (!obj) continue;

    const idProp = obj.getProperty('id');
    if (!idProp) continue;
    const id = idProp
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getInitializerIfKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralText();

    const apiProp = obj.getProperty('api');
    if (!apiProp) continue;
    const apiObj = apiProp
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    const names = new Set<string>();
    for (const bucket of ['props', 'events'] as const) {
      const p = apiObj.getProperty(bucket);
      if (!p) continue;
      const arr = p
        .asKindOrThrow(SyntaxKind.PropertyAssignment)
        .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
      collectNamesFromArray(arr, names);
    }
    out.set(id, names);
  }
  return out;
}

const registryMap = collectRegistryProps();

for (const g of games) {
  const actual = collectProps(g.typesPath, g.interfaceName);
  const documented = registryMap.get(g.id);
  if (!documented) {
    hadError = true;
    log('error', `${g.id}: registry 未列 props`);
    continue;
  }

  const missingInDocs = [...actual].filter((n) => !documented.has(n));
  const extraInDocs = [...documented].filter((n) => !actual.has(n));

  if (missingInDocs.length > 0) {
    hadError = true;
    log('error', `${g.id}: interface 有但 docs 缺 → ${missingInDocs.join(', ')}`);
  }
  if (extraInDocs.length > 0) {
    hadError = true;
    log('error', `${g.id}: docs 列了但 interface 沒 → ${extraInDocs.join(', ')}`);
  }
  if (missingInDocs.length === 0 && extraInDocs.length === 0) {
    log('info', `${g.id}: ✓ props 與 ${g.interfaceName} 對齊（${actual.size} 項）`);
  }
}

if (hadError) {
  log('error', 'check:docs 失敗。請同步 registry.ts 或 types.ts。');
  process.exit(1);
}
log('info', 'check:docs 通過。');
