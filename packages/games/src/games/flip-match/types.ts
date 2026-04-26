import type { BaseGameProps, GameState } from '../../core/types';

export interface FlipMatchCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

export interface FlipMatchProps extends BaseGameProps {
  /** 配對符號（每個會出現 2 次），預設 6 個 */
  symbols?: readonly string[];
  /** 相同配對後保留正面的延遲（ms），預設 400 */
  matchDelayMs?: number;
  /** 不配對翻回反面的延遲（ms），預設 900 */
  mismatchDelayMs?: number;
  onStart?: () => void;
  onMatch?: (symbol: string) => void;
  onMismatch?: () => void;
  onEnd?: (moves: number, timeSec: number) => void;
  onWin?: (moves: number, timeSec: number) => void;
  onClaim?: (moves: number, timeSec: number) => void;
}

export interface FlipMatchRef {
  flip: (index: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getMoves: () => number;
  getTime: () => number;
}
