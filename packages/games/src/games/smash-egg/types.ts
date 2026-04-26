import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface SmashEggProps extends BaseGameProps {
  /** 每顆蛋對應的獎品，預設 3 顆 */
  eggs: readonly Prize[];
  /** 從選擇到砸下的延遲（ms），預設 700 */
  hammerDelayMs?: number;
  /** 從砸下到揭曉的延遲（ms），預設 700 */
  revealDelayMs?: number;
  onStart?: () => void;
  onEnd?: (prize: Prize, index: number) => void;
  onWin?: (prize: Prize) => void;
  onLose?: (prize: Prize) => void;
  onClaim?: (prize: Prize) => void;
}

export interface SmashEggRef {
  pick: (index: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getPicked: () => number | null;
}
