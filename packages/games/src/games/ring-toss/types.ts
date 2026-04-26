import type { BaseGameProps, GameState } from '../../core/types';

export interface RingTossProps extends BaseGameProps {
  /** 每場可 toss 次數，預設 3 */
  attempts?: number;
  /** 勝利所需命中數，預設 2 */
  hitsToWin?: number;
  /** 目標柱位於 slider 的 % 位置，預設 50 */
  pegX?: number;
  /** 命中容差 %，預設 9 */
  tolerance?: number;
  /** slider 每 frame 推進的 %，預設 1.1 */
  sliderSpeed?: number;
  onStart?: () => void;
  onToss?: (pos: number, hit: boolean) => void;
  onEnd?: (hits: number, won: boolean) => void;
  onWin?: (hits: number) => void;
  onLose?: (hits: number) => void;
  onClaim?: (hits: number) => void;
}

export interface RingTossRef {
  start: () => void;
  toss: () => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getHits: () => number;
  getAttemptsLeft: () => number;
}
