import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GuessGift } from '../GuessGift';
import type { GuessGiftRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GuessGift — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(true);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onPick 傳入 (pickedSlot, ballCup, correct)', () => {
    const onPick = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} onPick={onPick} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(0));
    expect(onPick).toHaveBeenCalledWith(0, 0, true);
  });

  it('pick 錯答 → correct=false', () => {
    const onPick = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} onPick={onPick} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(1));
    expect(onPick).toHaveBeenCalledWith(1, 0, false);
  });

  it('onWin / onEnd(true)', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} onWin={onWin} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    expect(onWin).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(true);
  });

  it('onLose / onEnd(false)', () => {
    const onLose = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} onLose={onLose} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(1));
    act(() => vi.advanceTimersByTime(1000));
    expect(onLose).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(false);
  });
});
