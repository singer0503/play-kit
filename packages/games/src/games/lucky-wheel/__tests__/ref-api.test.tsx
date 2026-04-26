import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LuckyWheel } from '../LuckyWheel';
import type { LuckyWheelRef } from '../types';
import { demoPrizes, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('LuckyWheel — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ref 暴露 spin / reset / claim / getState / getRemaining', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.spin).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
  });

  it('spin(index) 強制停在指定 index', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.spin(6));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const [prize, idx] = onEnd.mock.calls[0] ?? [];
    expect(idx).toBe(6);
    expect(prize?.id).toBe('p7');
  });

  it('spin() 呼叫 2 次，第二次在 playing 時 no-op', () => {
    const onStart = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} onStart={onStart} prizeIndex={0} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => ref.current?.spin());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('getRemaining 反映 spin 完成後的遞減', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} defaultRemaining={3} prizeIndex={0} />, {
      wrapper: Wrapper,
    });
    expect(ref.current?.getRemaining()).toBe(3);
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ref.current?.getRemaining()).toBe(2);
  });

  it('claim() 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
    expect(ref.current?.getState()).toBe('idle');
  });

  it('won 後 claim() fire onClaim(prize)', () => {
    const onClaim = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} onClaim={onClaim} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledTimes(1);
    expect(onClaim.mock.calls[0]?.[0]?.id).toBe('p1');
  });

  it('reset() 中斷進行中的 spin 不會造成 late state 回寫', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => ref.current?.reset());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd).not.toHaveBeenCalled();
    expect(ref.current?.getState()).toBe('idle');
  });
});
