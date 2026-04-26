import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface ScratchCardProps extends BaseGameProps {
  /** 卡片底下的獎品 */
  prize: Prize;
  /** 刮除比例達此值即自動揭曉，預設 0.55（55%） */
  revealThreshold?: number;
  /** 每次 pointer move 刮除增加的 %（0–1），預設 0.02 */
  scratchGain?: number;
  onStart?: () => void;
  onProgress?: (ratio: number) => void;
  onReveal?: (prize: Prize) => void;
  onClaim?: (prize: Prize) => void;
}

export interface ScratchCardRef {
  /** 外部施加一次刮除動作（用於測試 / 自動化揭曉） */
  scratch: (ratioDelta?: number) => void;
  /** 強制揭曉（無視 threshold） */
  revealAll: () => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getProgress: () => number;
}
