import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftBox } from '../GiftBox';
import type { GiftBoxRef } from '../types';
import { demoBoxes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('GiftBox — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd 傳入 prize + index', () => {
    const onEnd = vi.fn();
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(2));
    act(() => vi.advanceTimersByTime(1000));
    expect(onEnd).toHaveBeenCalledWith(demoBoxes[2], 2);
  });

  it('onWin 在 win=true 獎品時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onLose).not.toHaveBeenCalled();
  });

  it('onLose 在 win=false 獎品時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.pick(1));
    act(() => vi.advanceTimersByTime(1000));
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('onClaim 收到對應 prize', () => {
    const onClaim = vi.fn();
    const ref = createRef<GiftBoxRef>();
    render(<GiftBox ref={ref} boxes={demoBoxes} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => vi.advanceTimersByTime(1000));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith(demoBoxes[0]);
  });
});
