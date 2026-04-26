import type { GameState } from './types';

// 六態狀態機的所有合法狀態。用於驗證、測試、狀態矩陣渲染。
export const GAME_STATES: readonly GameState[] = [
  'idle',
  'playing',
  'won',
  'lost',
  'claimed',
  'cooldown',
] as const;

// 參考用的合法轉移表。各 game 可以有自己的更嚴格規則（例：flip-match 不會從 won 回 playing）。
// 呼叫 canTransition 時回傳 true 不代表該 game 一定允許，只代表這是普遍合理的轉移之一。
const REFERENCE_TRANSITIONS: Record<GameState, readonly GameState[]> = {
  idle: ['playing', 'cooldown'],
  playing: ['won', 'lost', 'idle'],
  won: ['claimed', 'idle', 'cooldown'],
  lost: ['idle', 'playing', 'cooldown'],
  claimed: ['idle', 'cooldown'],
  cooldown: ['idle'],
};

export function canTransition(from: GameState, to: GameState): boolean {
  if (from === to) return true;
  return REFERENCE_TRANSITIONS[from].includes(to);
}

export function isTerminal(state: GameState): boolean {
  return state === 'claimed' || state === 'cooldown';
}
