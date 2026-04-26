import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Marquee } from '../Marquee';
import type { MarqueeRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Marquee — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設為 idle', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing → won', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
    act(() => vi.advanceTimersByTime(15000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('prizeIndex 指 lose → lost', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion 直接跳終態', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('won');
  });
});
