import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SlotMachine } from '../SlotMachine';
import type { SlotMachineRef } from '../types';

const Wrapper = makeWrapper('en');

describe('SlotMachine — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 spin / reset / claim / getState / getRemaining / getReels', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.spin).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
    expect(typeof ref.current?.getReels).toBe('function');
  });

  it('spin(forced) 覆寫 prop', () => {
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} forcedSymbols={[0, 1, 2]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin([5, 5, 5]));
    act(() => vi.advanceTimersByTime(3000));
    expect(ref.current?.getReels()).toEqual([5, 5, 5]);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<SlotMachineRef>();
    render(<SlotMachine ref={ref} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
