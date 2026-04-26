import type { BaseGameProps, GameState } from '../../core/types';

export interface ShakeDiceProps extends BaseGameProps {
  /** 骰子數量，預設 3 */
  diceCount?: number;
  /** 每顆骰子面數，預設 6 */
  faces?: number;
  /** 勝出的最低點數總和，預設 14 */
  winThreshold?: number;
  /** 三同是否也算勝（即便 sum < winThreshold）；預設 false，勝負只看 sum */
  tripleAlsoWins?: boolean;
  /** 搖晃動畫時長 ms，預設 1600 */
  shakeDurationMs?: number;
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  /** 後端指定的最終點數（長度應為 diceCount）；未指定時前端隨機 */
  forcedFaces?: readonly number[];
  onStart?: () => void;
  onEnd?: (faces: readonly number[], sum: number, won: boolean) => void;
  onWin?: (faces: readonly number[], sum: number) => void;
  onLose?: (faces: readonly number[], sum: number) => void;
  onClaim?: (faces: readonly number[], sum: number) => void;
}

export interface ShakeDiceRef {
  roll: (forcedFaces?: readonly number[]) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
  getFaces: () => readonly number[];
}
