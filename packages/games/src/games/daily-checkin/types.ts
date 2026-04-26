import type { BaseGameProps, GameState } from '../../core/types';

export interface DailyCheckinProps extends BaseGameProps {
  /** 每日獎勵陣列，長度代表連簽天數，預設 7 天 `[5,10,15,20,30,50,100]` */
  rewards?: readonly number[];
  /** 非受控：初始簽到狀態（長度同 rewards） */
  defaultChecked?: readonly boolean[];
  /** 受控：外部持有簽到狀態 */
  checked?: readonly boolean[];
  /** 簽到狀態變動時通知 */
  onCheckedChange?: (checked: readonly boolean[]) => void;
  /** 簽到點擊延遲 ms（動畫節奏），預設 700 */
  checkDelayMs?: number;
  onCheckIn?: (day: number, rewardPoints: number) => void;
  onEnd?: (totalPoints: number) => void;
  onWin?: (totalPoints: number) => void;
  onClaim?: (totalPoints: number) => void;
}

export interface DailyCheckinRef {
  checkIn: () => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getChecked: () => readonly boolean[];
  getTotalPoints: () => number;
}
