import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GuessGift } from '../GuessGift';
import type { GuessGiftRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GuessGift — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(true);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('pick 正確位置 → won', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('pick 錯誤位置 → lost', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(1));
    act(() => vi.advanceTimersByTime(1000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('remaining <= 0 時 start no-op', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('idle');
  });
});
