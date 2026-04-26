import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftRain } from '../GiftRain';
import type { GiftRainRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GiftRain — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing', () => {
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={5} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('時間到達且分數不足 → lost', () => {
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={3} scoreToWin={999} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(4000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    stubMatchMedia(true); // reducedMotion：start() 立即 won
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={5} scoreToWin={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('won');
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    stubMatchMedia(true);
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={5} scoreToWin={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion → start() 直接結算為 won', () => {
    stubMatchMedia(true);
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} scoreToWin={5} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('won');
    expect(ref.current?.getScore()).toBe(5);
  });
});
