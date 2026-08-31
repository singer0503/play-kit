import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ShakeDice } from '../ShakeDice';
import type { ShakeDiceRef } from '../types';

const Wrapper = makeWrapper('en');

describe('ShakeDice — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('roll 後 → playing → won（三同）', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('playing');
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('sum 剛好 winThreshold → won', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} winThreshold={14} forcedFaces={[5, 4, 5]} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('sum 低於門檻且非三同 → lost', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} winThreshold={14} forcedFaces={[1, 2, 3]} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('remaining <= 0 時 no-op', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} defaultRemaining={0} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion 直接解析', () => {
    stubMatchMedia(true);
    vi.useRealTimers();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    expect(ref.current?.getState()).toBe('won');
  });

  it('7–12 面骰以數字顯示，不會出現空白骰面', () => {
    const ref = createRef<ShakeDiceRef>();
    const { container } = render(<ShakeDice ref={ref} faces={12} forcedFaces={[8, 8, 8]} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    const faces = container.querySelectorAll('.pk-sd__face-number');
    expect(faces).toHaveLength(3);
    for (const face of faces) expect(face).toHaveTextContent('8');
  });

  it('五顆骰子使用動態尺寸且保持在同一列', () => {
    const { container } = render(<ShakeDice diceCount={5} />, { wrapper: Wrapper });
    const root = container.querySelector<HTMLElement>('.pk-sd');
    expect(container.querySelectorAll('.pk-sd__die')).toHaveLength(5);
    expect(root?.style.getPropertyValue('--pk-sd-die-size')).toContain('var(--pk-px');
  });

  it('lost 狀態只顯示單一再試一次動作', () => {
    const { container } = render(<ShakeDice state="lost" />, { wrapper: Wrapper });
    const actions = container.querySelectorAll('.pk-sd__cta button');
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveTextContent('Try again');
  });
});
