import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DollMachine } from '../DollMachine';
import type { DollMachineRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('DollMachine — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('forcedOutcome=true → won', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('forcedOutcome=false → lost', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={false} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion 立即結算', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    expect(ref.current?.getState()).toBe('won');
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} defaultRemaining={0} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    expect(ref.current?.getState()).toBe('idle');
  });
});
