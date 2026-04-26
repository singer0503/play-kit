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

    // 觀察 parent 寬度而非 element 自己。
    // 為什麼：game 的 children 用 `calc(N * var(--pk-px))` 表達寬度，
    // 寫入 --pk-scale 會讓 children 縮 → element 自己也縮（hug-content layout）
    // → ResizeObserver 再 fire → 寫入更小的 scale → 無限迴圈直到 scale=0。
    // Parent 的寬度由其上層 layout 決定，獨立於 children，不會回饋。
    const parent = el.parentElement;
    if (!parent) return;

    // 防回饋循環：若 parent 自己也是 content-sized（如 docs StateMatrix
    // 的 transform: scale wrapper），game 縮會讓 parent 也縮，RO 再 fire
    // → 慢速振盪。記住已套用的 width，新觀察值差距 < 1px 視為自己變動的
    // 回饋、忽略。真實 layout 變化（window resize）通常差很多 px、會通過。
    let lastAppliedWidth = -1;
    const FEEDBACK_THRESHOLD_PX = 1;

    const apply = (parentWidth: number) => {
      if (
        lastAppliedWidth >= 0 &&
        Math.abs(parentWidth - lastAppliedWidth) < FEEDBACK_THRESHOLD_PX
      ) {
        return;
      }
      lastAppliedWidth = parentWidth;
      const scale = parentWidth > 0 ? Math.min(1, parentWidth / designWidth) : 1;
      el.style.setProperty('--pk-scale', String(scale));
    };

    apply(parent.clientWidth);

    if (typeof ResizeObserver === 'undefined') {
      // 老設備（pre-2020）：set 一次當下值就退出，game 維持設計尺寸
      return;
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(entry.contentRect.width);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [designWidth, enabled]);

  return ref;
}
