import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { RingToss } from '../RingToss';
import type { RingTossRef } from '../types';

const Wrapper = makeWrapper('en');

describe('RingToss — state machine', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('預設 state 為 idle', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('toss 命中達門檻 → won', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={10} tolerance={5} attempts={1} hitsToWin={1} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(ref.current?.getState()).toBe('won');
  });

  it('toss 未命中 → lost', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={90} tolerance={2} attempts={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={10} tolerance={5} attempts={1} hitsToWin={1} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={10} tolerance={5} attempts={1} hitsToWin={1} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });
});
