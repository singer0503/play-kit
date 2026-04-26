import type { BaseGameProps, GameState } from '../../core/types';

export interface ShakeProps extends BaseGameProps {
  /** 時限內要達成的敲擊次數，預設 20 */
  tapsToWin?: number;
  /** 倒數秒數，預設 5 */
  durationSec?: number;
  /** 每場最大遊玩次數（決定 defaultRemaining 預設），預設 3 */
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  onStart?: () => void;
  /** 每次敲擊時 fire（含 current count） */
  onTap?: (count: number) => void;
  onEnd?: (won: boolean, count: number) => void;
  onWin?: () => void;
  onLose?: () => void;
  onClaim?: () => void;
}

export interface ShakeRef {
  start: () => void;
  tap: () => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getCount: () => number;
  getTimeLeft: () => number;
}
