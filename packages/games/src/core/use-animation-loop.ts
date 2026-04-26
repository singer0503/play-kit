import { useEffect, useRef } from 'react';
import { isSSR } from './is-ssr';

export interface AnimationLoopOptions {
  /** 為 true 時啟動 rAF 迴圈；false 自動清理 */
  enabled: boolean;
  /** prefers-reduced-motion 為 true 時不啟動；若呼叫者已另行處理可給 false */
  reducedMotion?: boolean;
  /** 每一幀的回呼；dtMs 為距離上一幀的毫秒差 */
  onFrame: (dtMs: number) => void;
}

/**
 * requestAnimationFrame 迴圈的 React hook 封裝。
 * - 自動處理 SSR guard、cleanup、prefers-reduced-motion skip。
 * - 呼叫者於 onFrame 直接更新 ref.style / refs，避免 setState 引發 re-render。
 * - 依 enabled 切換：變為 true 啟動、變為 false 清理。
 */
export function useAnimationLoop({
  enabled,
  reducedMotion = false,
  onFrame,
}: AnimationLoopOptions): void {
  // 用 ref 存放 onFrame 避免每次 callback 變化時重啟 rAF
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled || reducedMotion || isSSR()) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      onFrameRef.current(dt);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, reducedMotion]);
}
