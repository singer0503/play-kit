import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SmashEgg } from '../SmashEgg';
import type { SmashEggRef } from '../types';
import { demoEggs } from './test-utils';

const Wrapper = makeWrapper('en');

describe('SmashEgg — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('pick(win) → won', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('pick(lose) → lost', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(1));
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset 回 idle + picked=null', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
    expect(ref.current?.getPicked()).toBeNull();
  });

  it('reducedMotion → 立即結算', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    expect(ref.current?.getState()).toBe('won');
  });
});
