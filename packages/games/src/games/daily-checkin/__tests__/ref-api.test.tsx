import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DailyCheckin } from '../DailyCheckin';
import type { DailyCheckinRef } from '../types';

const Wrapper = makeWrapper('en');

describe('DailyCheckin — ref API', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('ref 暴露 checkIn / reset / claim / getState / getChecked / getTotalPoints', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5]} />, { wrapper: Wrapper });
    expect(typeof ref.current?.checkIn).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getChecked).toBe('function');
    expect(typeof ref.current?.getTotalPoints).toBe('function');
  });

  it('getChecked 反映 checkIn 結果', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10, 15]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    expect(ref.current?.getChecked()).toEqual([true, false, false]);
  });

  it('getTotalPoints 累加 rewards', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10, 15]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.checkIn());
    expect(ref.current?.getTotalPoints()).toBe(15);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10]} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
    expect(ref.current?.getState()).toBe('playing');
  });

  it('所有天簽完後，checkIn no-op（today < 0）', () => {
    const onCheckIn = vi.fn();
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5]} onCheckIn={onCheckIn} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.checkIn());
    expect(onCheckIn).toHaveBeenCalledTimes(1);
  });
});
