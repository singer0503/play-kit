import type { BaseGameProps, GameState } from '../../core/types';

export type LottoWinChecker = (drawn: readonly number[]) => boolean;

export interface LottoRollProps extends BaseGameProps {
  /** 號碼池上限，預設 49 */
  poolSize?: number;
  /** 抽幾顆，預設 6 */
  pickCount?: number;
  /** 後端指定的最終號碼；長度應為 pickCount */
  forcedNumbers?: readonly number[];
  /** 每顆號碼揭曉間隔（ms），預設 900 */
  pickIntervalMs?: number;
  /** 判斷勝敗的函式，預設：命中 >=2 個 7 或 11 的倍數即勝 */
  winChecker?: LottoWinChecker;
  maxPlays?: number;
  defaultRemaining?: number;
  remaining?: number;
  onRemainingChange?: (remaining: number) => void;
  onStart?: () => void;
  onEnd?: (numbers: readonly number[], won: boolean) => void;
  onWin?: (numbers: readonly number[]) => void;
  onLose?: (numbers: readonly number[]) => void;
  onClaim?: (numbers: readonly number[]) => void;
}

export interface LottoRollRef {
  draw: (forced?: readonly number[]) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getRemaining: () => number;
  getNumbers: () => readonly number[];
}
