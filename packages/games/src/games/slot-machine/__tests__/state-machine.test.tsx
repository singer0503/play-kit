import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SlotMachine } from '../SlotMachine';
import type { SlotMachineRef } from '../types';

const Wrapper = makeWrapper('en');

describe('SlotMachine — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('spin 三同 → won', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[2, 2, 2]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('spin 不同 → lost', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[0, 1, 2]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[2, 2, 2]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion 直接解析', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[3, 3, 3]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('won');
  });
});
