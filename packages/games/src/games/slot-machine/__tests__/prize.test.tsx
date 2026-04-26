import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SlotMachine } from '../SlotMachine';
import type { SlotMachineRef } from '../types';

const Wrapper = makeWrapper('en');

describe('SlotMachine — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd(symbols, won=true)', () => {
    const onEnd = vi.fn();
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[2, 2, 2]} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    expect(onEnd).toHaveBeenCalledWith([2, 2, 2], true);
  });

  it('onWin 帶 symbols', () => {
    const onWin = vi.fn();
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[1, 1, 1]} onWin={onWin} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    expect(onWin).toHaveBeenCalledWith([1, 1, 1]);
  });

  it('onLose 帶 symbols', () => {
    const onLose = vi.fn();
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[0, 1, 2]} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => vi.advanceTimersByTime(3000));
    expect(onLose).toHaveBeenCalledWith([0, 1, 2]);
  });
});
