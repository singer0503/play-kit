import type { BaseGameProps, GameState } from '../../core/types';

export interface GuessGiftProps extends BaseGameProps {
  /** 杯子數量，預設 3 */
  cupCount?: number;
  /** 交換次數，預設 7 */
  swapCount?: number;
  /** 每次交換動畫時長 ms，預設 650 */
  swapDurationMs?: number;
  /** 初始顯示球的毫秒數（記住位置），預設 900 */
  revealMs?: number;
  /** 後端指定球所在的 cup index（-1 表示本地隨機） */
  ballCupIndex?: number;
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  onStart?: () => void;
  onPick?: (pickedSlot: number, ballCup: number, correct: boolean) => void;
  onEnd?: (won: boolean) => void;
  onWin?: () => void;
  onLose?: () => void;
  onClaim?: () => void;
}

export interface GuessGiftRef {
  start: () => void;
  pick: (slot: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
  getBallCup: () => number;
}
