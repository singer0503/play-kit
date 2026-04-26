import type { BaseGameProps, GameState, Prize } from '../../core/types';

// 幸運轉盤獎品：延伸 Prize 型別加上視覺屬性
export interface LuckyWheelPrize extends Prize {
  /** 扇形填色（CSS color string） */
  color?: string;
  /** 圖示 emoji / 短字 */
  icon?: string;
}

export interface LuckyWheelProps extends BaseGameProps {
  /** 獎品列表，建議 6–12 項 */
  prizes: readonly LuckyWheelPrize[];
  /** 每場最大遊玩次數，預設 3 */
  maxPlays?: number;
  /** 非受控：初始剩餘次數，預設為 maxPlays */
  defaultRemaining?: number;
  /** 受控：外部持有剩餘次數 */
  remaining?: number;
  /** remaining 改變時 fire */
  onRemainingChange?: (remaining: number) => void;
  /** 預先指定本次要落在哪個 index（後端權威；-1 表示本地隨機） */
  prizeIndex?: number;
  /** 旋轉總毫秒，預設 4600 */
  duration?: number;
  /** 旋轉 CSS timing function */
  easing?: string;

  /** 事件：spin 啟動時 */
  onStart?: () => void;
  /** 事件：指針落定時（任何結果） */
  onEnd?: (prize: LuckyWheelPrize, index: number) => void;
  /** 事件：中獎時 */
  onWin?: (prize: LuckyWheelPrize) => void;
  /** 事件：未中獎時 */
  onLose?: (prize: LuckyWheelPrize) => void;
  /** 事件：領取獎勵時 */
  onClaim?: (prize: LuckyWheelPrize) => void;
}

export interface LuckyWheelRef {
  /** 啟動旋轉；可傳入 index 覆寫 prop prizeIndex */
  spin: (index?: number) => void;
  /** 重置到 idle */
  reset: () => void;
  /** 領取當前獎品（限 state === 'won'） */
  claim: () => void;
  /** 讀取當前 state */
  getState: () => GameState;
  /** 讀取剩餘次數 */
  getRemaining: () => number;
}
