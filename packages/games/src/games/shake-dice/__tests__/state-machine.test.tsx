import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ShakeDice } from '../ShakeDice';
import type { ShakeDiceRef } from '../types';

const Wrapper = makeWrapper('en');

describe('ShakeDice — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('roll 後 → playing → won（三同）', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('playing');
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('sum 剛好 winThreshold → won', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} winThreshold={14} forcedFaces={[5, 4, 5]} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('sum 低於門檻且非三同 → lost', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} winThreshold={14} forcedFaces={[1, 2, 3]} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion 直接解析', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('won');
  });
});
