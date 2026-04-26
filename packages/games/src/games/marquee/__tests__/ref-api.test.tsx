import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Marquee } from '../Marquee';
import type { MarqueeRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Marquee — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 start / reset / claim / getState / getRemaining', () => {
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
  });

  it('start(idx) 強制落在指定 index', () => {
    const onEnd = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.start(4));
    act(() => vi.advanceTimersByTime(15000));
    expect(onEnd.mock.calls[0]?.[1]).toBe(4);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<MarqueeRef>();
    render(<Marquee ref={ref} prizes={demoPrizes} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
