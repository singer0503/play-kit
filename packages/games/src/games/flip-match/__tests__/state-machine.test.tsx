import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { FlipMatch } from '../FlipMatch';
import type { FlipMatchRef } from '../types';

const Wrapper = makeWrapper('en');

describe('FlipMatch — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('flip 一張 → playing', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    expect(ref.current?.getState()).toBe('playing');
  });

  it('全配對 → won', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(500));
    expect(ref.current?.getState()).toBe('won');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(1));
    act(() => vi.advanceTimersByTime(500));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle 並清空 moves', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
    expect(ref.current?.getMoves()).toBe(0);
  });

  it('受控 state="cooldown" 下卡牌 disabled', () => {
    const { container } = render(<FlipMatch state="cooldown" symbols={['A', 'B']} />, {
      wrapper: Wrapper,
    });
    const firstBtn = container.querySelector('button.pk-fm__card');
    expect(firstBtn).toBeDisabled();
  });
});
