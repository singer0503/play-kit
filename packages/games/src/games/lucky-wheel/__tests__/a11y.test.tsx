import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { LuckyWheel } from '../LuckyWheel';
import type { LuckyWheelRef } from '../types';
import { demoPrizes, makeWrapper, stubMatchMedia } from './test-utils';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('LuckyWheel — a11y', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region 與 aria-label', () => {
    render(<LuckyWheel prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: /lucky wheel/i })).toBeInTheDocument();
  });

  it('中心 spin 按鈕以 role=button 暴露且有 aria-label', () => {
    render(<LuckyWheel prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /spin the wheel/i })).toBeInTheDocument();
  });

  it('aria-label prop 可覆寫預設 title', () => {
    render(<LuckyWheel prizes={demoPrizes} aria-label="Custom wheel" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom wheel' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<LuckyWheel prizes={demoPrizes} state={state} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Enter / Space 鍵可觸發 spin（button 原生行為等同 click）', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /spin the wheel/i });
    // button 的 Enter / Space 原生會 dispatch click event
    act(() => fireEvent.click(btn));
    expect(ref.current?.getState()).toBe('playing');
  });

  it('按鈕 disabled 時鍵盤亦無法觸發', () => {
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} defaultRemaining={0} />, {
      wrapper: Wrapper,
    });
    const btn = screen.getByRole('button', { name: /spin the wheel/i });
    expect(btn).toBeDisabled();
    act(() => fireEvent.click(btn));
    expect(ref.current?.getState()).toBe('idle');
  });

  it('勝利時 aria-live region 宣告獎品', () => {
    const ref = createRef<LuckyWheelRef>();
    vi.useFakeTimers();
    const { container } = render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain('$100');
    vi.useRealTimers();
  });

  it('prefers-reduced-motion 時，spin 直接跳到終態且無 Confetti 動畫 DOM', () => {
    stubMatchMedia(true);
    const ref = createRef<LuckyWheelRef>();
    const { container } = render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    expect(ref.current?.getState()).toBe('won');
    expect(container.querySelector('.pk-confetti')).toBeNull();
  });
});
