import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Shake } from '../Shake';
import type { ShakeRef } from '../types';

const Wrapper = makeWrapper('en');

describe('Shake — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onTap 每次觸發，帶 count', () => {
    const onTap = vi.fn();
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={10} onTap={onTap} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.tap());
    act(() => ref.current?.tap());
    expect(onTap).toHaveBeenCalledTimes(2);
    expect(onTap).toHaveBeenLastCalledWith(2);
  });

  it('onWin + onEnd(true, count)', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={1} onWin={onWin} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.tap());
    expect(onWin).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(true, 1);
  });

  it('onLose + onEnd(false, count)', () => {
    const onLose = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={100} durationSec={1} onLose={onLose} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(1500));
    expect(onLose).toHaveBeenCalled();
    expect(onEnd.mock.calls[0]?.[0]).toBe(false);
  });
});
