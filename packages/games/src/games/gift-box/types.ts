import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface GiftBoxProps extends BaseGameProps {
  /** 每個禮盒對應的獎品，預設 5 盒 */
  boxes: readonly Prize[];
  /** 打開延遲（ms），預設 700 */
  openDelayMs?: number;
  onStart?: () => void;
  onEnd?: (prize: Prize, index: number) => void;
  onWin?: (prize: Prize) => void;
  onLose?: (prize: Prize) => void;
  onClaim?: (prize: Prize) => void;
}

export interface GiftBoxRef {
  pick: (index: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getPicked: () => number | null;
}
