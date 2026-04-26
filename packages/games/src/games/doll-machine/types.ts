import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface DollMachineProps extends BaseGameProps {
  /** 獎品池 */
  prizes: readonly Prize[];
  /** 中獎機率（0–1）；當 forcedOutcome 與 targetX 都未指定時使用，預設 0.3 */
  winRate?: number;
  /** 後端權威覆寫：true=必中、false=必敗、undefined=依 targetX 判定或 winRate */
  forcedOutcome?: boolean;
  /** 強制指定的 prize index（預設隨機從 prizes 抽） */
  forcedPrizeIndex?: number;
  /** 目標娃娃 x 位置（%）；與 claw pos 比較判定命中，預設 70 */
  targetX?: number;
  /** 命中容差（%），預設 12 */
  tolerance?: number;
  /** claw 每 frame 前進的 %，預設 0.55 */
  sliderSpeed?: number;
  /** 夾取動畫時長 ms，預設 1600 */
  grabDurationMs?: number;
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  onStart?: () => void;
  onEnd?: (prize: Prize | null, won: boolean) => void;
  onWin?: (prize: Prize) => void;
  onLose?: () => void;
  onClaim?: (prize: Prize) => void;
}

export interface DollMachineRef {
  tryGrab: () => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
}
