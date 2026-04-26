import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftBox } from '../GiftBox';
import type { GiftBoxRef } from '../types';
import { demoBoxes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('GiftBox — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('pick(win) → won', () => {
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    expect(ref.current?.getState()).toBe('won');
  });

  it('pick(lose) → lost', () => {
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(1));
    act(() => vi.advanceTimersByTime(1000));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset 回 idle 並清 picked', () => {
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
    expect(ref.current?.getPicked()).toBeNull();
  });

  it('受控 state="cooldown" 下盒子 disabled', () => {
    const { container } = render(<GiftBox boxes={demoBoxes} state="cooldown" />, {
      wrapper: Wrapper,
    });
    const boxes = container.querySelectorAll('button[aria-label*="box" i]');
    for (const b of boxes) expect(b).toBeDisabled();
  });
});
