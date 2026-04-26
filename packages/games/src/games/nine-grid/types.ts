import type { BaseGameProps, GameState, Prize } from '../../core/types';

export interface NineGridCell extends Prize {
  icon?: string;
}

export interface NineGridProps extends BaseGameProps {
  /** 8 個外圈獎品（順時針：上排左→中→右，中排右，下排右→中→左，中排左） */
  cells: readonly NineGridCell[];
  /** 每場最大遊玩次數，預設 3 */
  maxPlays?: number;
  /** 非受控：初始剩餘次數 */
  defaultRemaining?: number;
  /** 受控：外部持有剩餘次數 */
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  /** 後端指定的落定 cell index（0–7）；-1 表示隨機 */
  prizeIndex?: number;
  /** 著地前完整繞圈次數，預設 3 */
  loops?: number;
  /** 開始轉燈時每格間隔，預設 80ms */
  stepInterval?: number;

  onStart?: () => void;
  onEnd?: (prize: NineGridCell, index: number) => void;
  onWin?: (prize: NineGridCell) => void;
  onLose?: (prize: NineGridCell) => void;
  onClaim?: (prize: NineGridCell) => void;
}

export interface NineGridRef {
  start: (index?: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
}
