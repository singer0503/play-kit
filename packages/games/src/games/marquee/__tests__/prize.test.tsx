import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Marquee } from '../Marquee';
import type { MarqueeRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Marquee — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd 收到 prize + index', () => {
    const onEnd = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={2} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    expect(onEnd).toHaveBeenCalledWith(demoPrizes[2], 2);
  });

  it('onWin 觸發 win prize，不觸發 onLose', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} onWin={onWin} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onLose).not.toHaveBeenCalled();
  });

  it('onLose 觸發 lose prize', () => {
    const onLose = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={1} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    expect(onLose).toHaveBeenCalled();
  });

  it('onClaim 帶 prize', () => {
    const onClaim = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} prizeIndex={0} onClaim={onClaim} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(15000));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith(demoPrizes[0]);
  });
});
