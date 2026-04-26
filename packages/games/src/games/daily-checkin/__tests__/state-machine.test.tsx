import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DailyCheckin } from '../DailyCheckin';
import type { DailyCheckinRef } from '../types';

const Wrapper = makeWrapper('en');

describe('DailyCheckin — state machine', () => {
  beforeEach(() => stubMatchMedia(true)); // reducedMotion：checkIn 立即結算
  afterEach(() => vi.restoreAllMocks());

  it('預設 state 為 playing', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10]} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('playing');
  });

  it('最後一天 checkIn → won', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.checkIn());
    expect(ref.current?.getState()).toBe('won');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset 回到 playing 並清空 checked', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('playing');
    expect(ref.current?.getChecked()).toEqual([false, false]);
  });

  it('受控 state="cooldown" → render cooldown UI（主動作按鈕不顯示）', () => {
    render(<DailyCheckin rewards={[5, 10]} state="cooldown" />, { wrapper: Wrapper });
    // 沒有 primary CTA（checkIn / claim）
    expect(screen.queryByRole('button', { name: /\+5|claim/i })).toBeNull();
  });

  it('受控 state="claimed" → checkIn no-op', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10]} state="claimed" />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    // 外部受控，state 仍為 claimed
    expect(ref.current?.getState()).toBe('claimed');
  });
});
