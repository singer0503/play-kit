import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftRain } from '../GiftRain';
import type { GiftRainRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GiftRain — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tap bomb 扣分並 fire onCatch', () => {
    const onCatch = vi.fn();
    const ref = createRef<GiftRainRef>();
    render(
      <GiftRain
        ref={ref}
        durationSec={5}
        kindProbabilities={{ gold: 0, bomb: 1, red: 0 }}
        onCatch={onCatch}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(400));
    act(() => ref.current?.tap(1));
    expect(onCatch).toHaveBeenCalled();
    expect(onCatch.mock.calls[0]?.[1]).toBe(-2);
  });

  it('時間到達且分數不足 → onLose + onEnd(won=false)', () => {
    const onLose = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={3} scoreToWin={999} onLose={onLose} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(4000));
    expect(onLose).toHaveBeenCalled();
    expect(onEnd.mock.calls[0]?.[1]).toBe(false);
  });

  it('reducedMotion 直接 win → onWin + onEnd(won=true)', () => {
    stubMatchMedia(true);
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} scoreToWin={5} onWin={onWin} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(onWin).toHaveBeenCalledWith(5);
    expect(onEnd).toHaveBeenCalledWith(5, true);
  });
});
