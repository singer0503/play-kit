import { describe, expect, it } from 'vitest';
import { GAME_STATES, canTransition, isTerminal } from '../state-machine';

describe('state-machine', () => {
  it('恰有 6 個合法 state', () => {
    expect(GAME_STATES).toEqual(['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown']);
  });

  it('self-transition 視為合法', () => {
    for (const s of GAME_STATES) expect(canTransition(s, s)).toBe(true);
  });

  it('idle → playing OK；won → playing 不合法', () => {
    expect(canTransition('idle', 'playing')).toBe(true);
    expect(canTransition('won', 'playing')).toBe(false);
  });

  it('won → claimed / idle / cooldown 合法', () => {
    expect(canTransition('won', 'claimed')).toBe(true);
    expect(canTransition('won', 'idle')).toBe(true);
    expect(canTransition('won', 'cooldown')).toBe(true);
  });

  it('isTerminal 只認 claimed / cooldown', () => {
    expect(isTerminal('claimed')).toBe(true);
    expect(isTerminal('cooldown')).toBe(true);
    expect(isTerminal('idle')).toBe(false);
    expect(isTerminal('won')).toBe(false);
  });
});
