import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { LottoRoll } from '../LottoRoll';
import type { LottoRollRef } from '../types';

const Wrapper = makeWrapper('en');

describe('LottoRoll — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd(numbers, won=true)', () => {
    const onEnd = vi.fn();
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[7, 14, 11]} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(onEnd).toHaveBeenCalledWith([7, 14, 11], true);
  });

  it('自訂 winChecker 控制勝敗', () => {
    const winChecker = (numbers: readonly number[]) => numbers.includes(42);
    const ref = createRef<LottoRollRef>();
    render(
      <LottoRoll ref={ref} pickCount={3} forcedNumbers={[1, 42, 3]} winChecker={winChecker} />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('onWin 帶 numbers', () => {
    const onWin = vi.fn();
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[7, 14, 11]} onWin={onWin} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(onWin).toHaveBeenCalledWith([7, 14, 11]);
  });

  it('onLose 帶 numbers', () => {
    const onLose = vi.fn();
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[1, 2, 3]} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(onLose).toHaveBeenCalledWith([1, 2, 3]);
  });
});
