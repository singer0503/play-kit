// 偵測當前環境是否為 server-side rendering。
// 所有 browser-only API（window / document / localStorage / navigator）都要先 guard。
export function isSSR(): boolean {
  return typeof window === 'undefined';
}
