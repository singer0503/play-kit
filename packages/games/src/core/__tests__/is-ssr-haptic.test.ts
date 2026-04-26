import { afterEach, describe, expect, it, vi } from 'vitest';
import { haptic } from '../haptic';
import { isSSR } from '../is-ssr';

describe('isSSR + haptic', () => {
  afterEach(() => vi.restoreAllMocks());

  it('jsdom 環境：isSSR 為 false', () => {
    expect(isSSR()).toBe(false);
  });

  it('haptic 呼叫 navigator.vibrate（若存在）', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrate,
      configurable: true,
      writable: true,
    });
    haptic(30);
    expect(vibrate).toHaveBeenCalledWith(30);
    haptic([10, 20, 30]);
    expect(vibrate).toHaveBeenLastCalledWith([10, 20, 30]);
  });

  it('navigator.vibrate 不存在時安靜 no-op（不 throw）', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => haptic(30)).not.toThrow();
  });
});
