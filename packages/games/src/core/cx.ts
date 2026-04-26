// className 合併：濾掉 falsy、以空白 join。
// 僅 library 內部用，不對外 export（保持 peerDependencies 只有 react / react-dom，
// 且外部另有 clsx / classnames 等成熟方案可選）。
export const cx = (...xs: Array<string | false | undefined | null>): string =>
  xs.filter(Boolean).join(' ');
