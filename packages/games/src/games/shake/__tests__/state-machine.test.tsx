import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Shake } from '../Shake';
import type { ShakeRef } from '../types';

const Wrapper = makeWrapper('en');

describe('Shake — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={5} durationSec={3} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('達到 tapsToWin 立即轉 won', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={3} durationSec={10} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => {
      ref.current?.tap();
      ref.current?.tap();
      ref.current?.tap();
    });
    expect(ref.current?.getState()).toBe('won');
  });

  it('時間用完未達標 → lost', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={100} durationSec={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.tap());
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={100} durationSec={10} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('remaining <= 0 時 start no-op', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion → start 立即 won', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={100} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('won');
  });
});
