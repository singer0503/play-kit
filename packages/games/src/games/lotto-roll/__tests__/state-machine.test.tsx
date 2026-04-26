import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { LottoRoll } from '../LottoRoll';
import type { LottoRollRef } from '../types';

const Wrapper = makeWrapper('en');

describe('LottoRoll — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('命中條件 → won', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[7, 14, 11]} />, { wrapper: Wrapper });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('未命中 → lost', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[1, 2, 3]} />, { wrapper: Wrapper });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[7, 14, 11]} />, { wrapper: Wrapper });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle 且清 numbers', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[7, 14, 11]} />, { wrapper: Wrapper });
    act(() => ref.current?.draw());
    act(() => vi.advanceTimersByTime(10000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
    expect(ref.current?.getNumbers()).toEqual([]);
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.draw());
    expect(ref.current?.getState()).toBe('idle');
  });
});
