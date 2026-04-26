import { type RefObject, useEffect, useRef } from 'react';
import { isSSR } from './is-ssr';

export interface UseGameScaleOptions {
  /**
   * 預設 true。embedder 想保證 game 以設計尺寸渲染（不縮放）時設 false，
   * hook 會清掉 `--pk-scale` 變數，CSS 走 fallback 值 1。
   */
  enabled?: boolean;
}

/**
 * 監聽容器寬度，計算與設計基準的縮放比例（0..1），寫入元素的 inline style
 * 作為 CSS custom property `--pk-scale`。配合各 game CSS 的
 * `calc(N px * var(--pk-scale, 1))` 規約，遊戲在窄容器自動等比縮小。
 *
 * 設計原則：
 * - **SSR / 初次 render**：CSS 內 `var(--pk-scale, 1)` fallback 為 1，
 *   靜態 HTML 與設計尺寸一致。JS 接手後 ResizeObserver 即時更新。
 * - **比例 cap 在 1**：只往下縮、不放大，避免大螢幕把 game 撐成巨型。
 * - **老設備 fallback**：無 ResizeObserver 環境（極舊瀏覽器）一樣不會 throw，
 *   設一次初值就停，game 回到設計尺寸 + 外層 `max-width: 100%` 防溢出。
 *
 * @param designWidth 各 game 自宣告的設計基準寬度（px）。例如 lucky-wheel 340、
 *                    lotto-roll 360、scratch-card 320。
 * @param options.enabled 預設 true。`PlayKitProvider scale="off"` 會傳 false。
 * @returns ref 應掛在最外層 `.pk-game` 元素上。
 *
 * @example
 *   export const LuckyWheel = forwardRef<LuckyWheelRef, LuckyWheelProps>(
 *     (props, ref) => {
 *       const scaleRef = useGameScale<HTMLElement>(340);
 *       return <section ref={scaleRef} className="pk-game pk-lw">{...}</section>;
 *     },
 *   );
 */
export function useGameScale<T extends HTMLElement = HTMLElement>(
  designWidth: number,
  options: UseGameScaleOptions = {},
): RefObject<T> {
  const { enabled = true } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (isSSR()) return;
    const el = ref.current;
    if (!el) return;

    if (!enabled) {
      // opt-out：清掉 inline 變數，CSS 退到 var(--pk-scale, 1) 預設值
      el.style.removeProperty('--pk-scale');
      return;
    }

    const apply = (w: number) => {
      const scale = w > 0 ? Math.min(1, w / designWidth) : 1;
      el.style.setProperty('--pk-scale', String(scale));
    };

    apply(el.clientWidth);

    if (typeof ResizeObserver === 'undefined') {
      // 老設備（pre-2020）：set 一次當下值就退出，game 維持設計尺寸
      return;
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth, enabled]);

  return ref;
}
