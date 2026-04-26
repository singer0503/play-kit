import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { FlipMatch } from '../FlipMatch';
import type { FlipMatchRef } from '../types';

const Wrapper = makeWrapper('en');

describe('FlipMatch — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onMatch 在配對相同時觸發，帶對應 symbol', () => {
    const onMatch = vi.fn();
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} onMatch={onMatch} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(500));
    expect(onMatch).toHaveBeenCalledWith('A');
  });

  it('onMismatch 在不同 symbol 時觸發', () => {
    const onMismatch = vi.fn();
    const ref = createRef<FlipMatchRef>();
    // Math.random=0 shuffle 後 deck=[B,A,B,A]；flip(0)+flip(1) 是 B vs A（mismatch）
    render(<FlipMatch ref={ref} symbols={['A', 'B']} onMismatch={onMismatch} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(1500));
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });

  it('全配對後 onEnd / onWin 收到 moves + time', () => {
    const onEnd = vi.fn();
    const onWin = vi.fn();
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} onEnd={onEnd} onWin={onWin} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(500));
    expect(onEnd).toHaveBeenCalled();
    expect(onWin).toHaveBeenCalled();
  });

  it('onClaim 在 won 後呼叫 claim 時觸發', () => {
    const onClaim = vi.fn();
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(500));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalled();
  });
});
