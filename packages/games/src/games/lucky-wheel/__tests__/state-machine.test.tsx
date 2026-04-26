import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LuckyWheel } from '../LuckyWheel';
import type { LuckyWheelRef } from '../types';
import { demoPrizes, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('LuckyWheel — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('spin() 轉 idle → playing → won 並 fire onStateChange', () => {
    const onStateChange = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(
      <LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} onStateChange={onStateChange} />,
      { wrapper: Wrapper },
    );

    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('playing');
    expect(onStateChange).toHaveBeenCalledWith('playing');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ref.current?.getState()).toBe('won'); // prizeIndex=0 win=true
    expect(onStateChange).toHaveBeenCalledWith('won');
  });

  it('prizeIndex 指向非 win 獎品時轉到 lost', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={1} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim() → claimed', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset() 任何 state 皆回 idle', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('remaining <= 0 時 spin no-op，state 不變', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('prizes 為空陣列時 spin no-op', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={[]} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('受控 state 時，外部 state="cooldown" 會 render cooldown UI', () => {
    const { container } = render(<LuckyWheel prizes={demoPrizes} state="cooldown" />, {
      wrapper: Wrapper,
    });
    // state badge data-state=cooldown
    expect(container.querySelector('[data-state="cooldown"]')).toBeInTheDocument();
    // 中心 spin 按鈕被 disabled
    const btn = screen.getByRole('button', { name: /spin the wheel/i });
    expect(btn).toBeDisabled();
  });

  it('受控 state 時，spin() 仍 fire onStateChange 但不改內部 state（由外部同步）', () => {
    const onStateChange = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(
      <LuckyWheel
        ref={ref}
        prizes={demoPrizes}
        state="idle"
        onStateChange={onStateChange}
        prizeIndex={0}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.spin());
    expect(onStateChange).toHaveBeenCalledWith('playing');
    // controlled mode：state 仍為 idle（由外部控制）
    expect(ref.current?.getState()).toBe('idle');
  });

  it('hub button click 等效於 spin()', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /spin the wheel/i });
    await user.click(btn);
    expect(ref.current?.getState()).toBe('playing');
  });
});
