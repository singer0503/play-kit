import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GuessGift } from '../GuessGift';
import type { GuessGiftRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GuessGift — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(true);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 start / pick / reset / claim / getState / getRemaining / getBallCup', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.pick).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
    expect(typeof ref.current?.getBallCup).toBe('function');
  });

  it('getBallCup 指定時回傳 ballCupIndex', () => {
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} ballCupIndex={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getBallCup()).toBe(2);
  });

  it('pick 在非 playing 時 no-op', () => {
    const onPick = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} onPick={onPick} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    expect(onPick).not.toHaveBeenCalled();
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<GuessGiftRef>();
    render(<GuessGift ref={ref} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
