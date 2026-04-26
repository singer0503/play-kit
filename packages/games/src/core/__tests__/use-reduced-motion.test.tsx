import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from '../use-reduced-motion';

type Listener = (e: { matches: boolean }) => void;

function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  const mq = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_evt: string, cb: Listener) => listeners.add(cb)),
    removeEventListener: vi.fn((_evt: string, cb: Listener) => listeners.delete(cb)),
    // 相容舊 API（不會被 hook 用到，但免得 jsdom 抱怨）
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  };

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mq),
  });

  return {
    mq,
    fire(matches: boolean) {
      mq.matches = matches;
      for (const cb of listeners) cb({ matches });
    },
  };
}

describe('useReducedMotion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('預設為 false', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('當使用者偏好開啟時回 true', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('listener 切換時同步更新', () => {
    const ctl = stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => ctl.fire(true));
    expect(result.current).toBe(true);
  });
});
