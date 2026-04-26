import type { BaseGameProps, GameState } from '../../core/types';

export type DropKind = 'red' | 'gold' | 'bomb';

export interface GiftRainDrop {
  id: number;
  kind: DropKind;
  left: number;
  durationMs: number;
}

export interface GiftRainProps extends BaseGameProps {
  /** 遊戲時長秒數，預設 10 */
  durationSec?: number;
  /** 勝利所需分數，預設 8 */
  scoreToWin?: number;
  /** 每幾 ms 產生一個 drop，預設 380 */
  spawnIntervalMs?: number;
  /** 掉落時長範圍 (min, max) ms，預設 [2400, 3800] */
  dropDurationRangeMs?: readonly [number, number];
  /** 各類 drop 的機率總和應為 1，預設 { gold: 0.12, bomb: 0.16, red: 0.72 } */
  kindProbabilities?: Readonly<Record<DropKind, number>>;
  /** 各 kind 的分數變化；負數代表扣分，預設 red:+1, gold:+3, bomb:-2 */
  scoreByKind?: Readonly<Record<DropKind, number>>;
  onStart?: () => void;
  onCatch?: (drop: GiftRainDrop, scoreDelta: number) => void;
  onEnd?: (score: number, won: boolean) => void;
  onWin?: (score: number) => void;
  onLose?: (score: number) => void;
  onClaim?: (score: number) => void;
}

export interface GiftRainRef {
  start: () => void;
  tap: (id: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getScore: () => number;
  getTimeLeft: () => number;
}
