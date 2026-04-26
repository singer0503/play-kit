import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NineGrid } from '../NineGrid';
import type { NineGridRef } from '../types';
import { demoCells, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('NineGrid — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start() 轉到 playing，animation 結束後到 won', () => {
    const onStateChange = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} onStateChange={onStateChange} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');

    // 3 loops × 8 + prizeIndex=0 = 24 steps；每步最大 ~200ms，推進 10s 足夠
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('prizeIndex 指向非 win 時到 lost', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim() → claimed', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset() 清 state / activeIdx', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('remaining=0 時 start no-op', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('cells 不是 8 個時 start no-op', () => {
    const ref = createRef<NineGridRef>();
    const fewer = demoCells.slice(0, 5);
    render(<NineGrid ref={ref} cells={fewer} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('受控 cooldown 時中心按鈕 disabled', () => {
    render(<NineGrid cells={demoCells} state="cooldown" />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });

  it('reducedMotion 時 start 立即解析，不走 animation loop', () => {
    stubMatchMedia(true);
    vi.useRealTimers(); // 不需要 fake timers
    const onEnd = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(ref.current?.getState()).toBe('won');
  });
});
