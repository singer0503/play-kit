import { isSSR } from './is-ssr';

// 觸發裝置震動。SSR / 不支援的環境安靜 no-op。
// pattern 可為單一毫秒數或 on/off 交替陣列，規格同 navigator.vibrate。
export function haptic(pattern: number | number[]): void {
  if (isSSR()) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
