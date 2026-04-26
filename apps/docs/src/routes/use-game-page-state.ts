import type { GameState } from '@play-kit/games';
import { useCallback, useMemo, useState } from 'react';

export type Tab = 'demo' | 'code';

/**
 * 收斂 GamePage 的多個 state slice 到單一 hook：
 *   - tab（預覽 / 程式碼）
 *   - resetKey（強迫 demo 重 mount）
 *   - demoState（StateMatrix 覆寫主 demo 的 state）
 *   - stagedOverrides（derive 自 demoState，供 game.render 用）
 * 按 reset() 一鍵清空並 bump key。
 */
export function useGamePageState() {
  const [tab, setTab] = useState<Tab>('demo');
  const [resetKey, setResetKey] = useState(0);
  const [demoState, setDemoState] = useState<GameState | undefined>();

  const stagedOverrides = useMemo(
    () => (demoState ? { state: demoState } : undefined),
    [demoState],
  );

  const reset = useCallback(() => {
    setResetKey((k) => k + 1);
    setDemoState(undefined);
  }, []);

  return {
    tab,
    setTab,
    resetKey,
    demoState,
    setDemoState,
    stagedOverrides,
    reset,
  };
}
