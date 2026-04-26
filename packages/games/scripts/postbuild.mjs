#!/usr/bin/env node
// 補上 vite library build 不會自動產的小檔。目前只有：
//
//   dist/styles.css.d.ts —— 讓 `import '@play-kit/games/styles.css'` 在 strict TS
//   下不會 ERR TS2882。Side-effect import 不需要 export 任何東西，空 module 即可。

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../dist');

writeFileSync(
  resolve(DIST, 'styles.css.d.ts'),
  '// Side-effect import for global @play-kit/games styles. No exported symbols.\nexport {};\n',
);

console.log('[postbuild] wrote dist/styles.css.d.ts');
