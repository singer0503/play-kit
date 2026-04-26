import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SmashEgg } from '../SmashEgg';
import type { SmashEggRef } from '../types';
import { demoEggs } from './test-utils';

const Wrapper = makeWrapper('en');

describe('SmashEgg — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd 傳入 prize + index', () => {
    const onEnd = vi.fn();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(2));
    act(() => vi.advanceTimersByTime(2000));
    expect(onEnd).toHaveBeenCalledWith(demoEggs[2], 2);
  });

  it('onWin / onLose 對應 win 欄位', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.pick(1)); // lose
    act(() => vi.advanceTimersByTime(2000));
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('onClaim 收到 prize', () => {
    const onClaim = vi.fn();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith(demoEggs[0]);
  });
});
