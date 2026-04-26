import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NineGrid } from '../NineGrid';
import type { NineGridRef } from '../types';
import { demoCells, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('NineGrid — prize determination', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('prizeIndex prop 強制停該 pos', () => {
    const onEnd = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={3} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(onEnd.mock.calls[0]?.[1]).toBe(3);
  });

  it('onWin 只在 win=true 時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onLose).not.toHaveBeenCalled();
  });

  it('onLose 只在 win=false 時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={2} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('index 超界 clamp 到 7', () => {
    const onEnd = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.start(99));
    act(() => vi.advanceTimersByTime(10000));
    expect(onEnd.mock.calls[0]?.[1]).toBe(7);
  });
});
