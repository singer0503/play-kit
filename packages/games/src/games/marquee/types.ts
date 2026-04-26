import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface MarqueePrize extends Prize {
  icon?: string;
}

export interface MarqueeProps extends BaseGameProps {
  prizes: readonly MarqueePrize[];
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  prizeIndex?: number;
  loops?: number;
  stepInterval?: number;
  onStart?: () => void;
  onEnd?: (prize: MarqueePrize, index: number) => void;
  onWin?: (prize: MarqueePrize) => void;
  onLose?: (prize: MarqueePrize) => void;
  onClaim?: (prize: MarqueePrize) => void;
}

export interface MarqueeRef {
  start: (index?: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
}
