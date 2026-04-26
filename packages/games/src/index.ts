// @play-kit/games 主入口。
// - core 與 i18n 匯出在頂層
// - 各 game 以 sub-barrel 形式重新匯出，tree-shaking 能將未用的 game 剔除

// Core utilities + types
export * from './core';

// i18n
export * from './i18n';

// Games（17 款，依 id 字母序排）
export * from './games/daily-checkin';
export * from './games/doll-machine';
export * from './games/flip-match';
export * from './games/gift-box';
export * from './games/gift-rain';
export * from './games/guess-gift';
export * from './games/lotto-roll';
export * from './games/lucky-wheel';
export * from './games/marquee';
export * from './games/nine-grid';
export * from './games/quiz';
export * from './games/ring-toss';
export * from './games/scratch-card';
export * from './games/shake';
export * from './games/shake-dice';
export * from './games/slot-machine';
export * from './games/smash-egg';

// 帶入 theme tokens + core primitives；vite 在 library build 把所有 CSS 合併到 dist/styles.css
// 沒有 vite-plugin-lib-inject-css 時，這個 import 不會被寫進 JS bundle，純做 CSS 收集 trigger
// Consumer 還是要顯式 `import '@play-kit/games/styles.css'`（README 的標準寫法）
import './styles.css';
