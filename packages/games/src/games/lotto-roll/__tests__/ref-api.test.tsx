import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { LottoRoll } from '../LottoRoll';
import type { LottoRollRef } from '../types';

const Wrapper = makeWrapper('en');

describe('LottoRoll — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 draw / reset / claim / getState / getRemaining / getNumbers', () => {
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.draw).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
    expect(typeof ref.current?.getNumbers).toBe('function');
  });

  it('draw(forced) 覆寫 prop forcedNumbers', () => {
    const onEnd = vi.fn();
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} pickCount={3} forcedNumbers={[1, 2, 3]} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.draw([7, 14, 11]));
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getNumbers()).toEqual([7, 14, 11]);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<LottoRollRef>();
    render(<LottoRoll ref={ref} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
