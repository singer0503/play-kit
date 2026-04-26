import type { BaseGameProps, GameState } from '../../core/types';

export interface SlotMachineProps extends BaseGameProps {
  /** 輪子符號池，預設 `['🍒','🍋','🔔','⭐','💎','7️⃣']` */
  symbols?: readonly string[];
  /** 輪數，預設 3 */
  reelCount?: number;
  /** 強制三同的機率（0–1），預設 0.28 */
  winRate?: number;
  /** 後端指定的最終符號 index 陣列；未指定時本地決定 */
  forcedSymbols?: readonly number[];
  /** 各輪停止時間（ms），預設 `[1100, 1700, 2400]` */
  stopTimes?: readonly number[];
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  onStart?: () => void;
  onEnd?: (symbols: readonly number[], won: boolean) => void;
  onWin?: (symbols: readonly number[]) => void;
  onLose?: (symbols: readonly number[]) => void;
  onClaim?: (symbols: readonly number[]) => void;
}

export interface SlotMachineRef {
  spin: (forced?: readonly number[]) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
  getReels: () => readonly number[];
}
