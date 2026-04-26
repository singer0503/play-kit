import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NineGrid } from '../NineGrid';
import type { NineGridRef } from '../types';
import { demoCells, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('NineGrid — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ref 暴露 start / reset / claim / getState / getRemaining', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
  });

  it('start(index) 強制停在該 outer position', () => {
    const onEnd = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.start(5));
    act(() => vi.advanceTimersByTime(10000));
    expect(onEnd.mock.calls[0]?.[1]).toBe(5);
  });

  it('playing 中第二次 start no-op', () => {
    const onStart = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} onStart={onStart} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.start());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('getRemaining 反映完成後遞減', () => {
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} defaultRemaining={3} prizeIndex={0} />, {
      wrapper: Wrapper,
    });
    expect(ref.current?.getRemaining()).toBe(3);
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    expect(ref.current?.getRemaining()).toBe(2);
  });

  it('claim() 在非 won 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('won 後 claim() fire onClaim(prize)', () => {
    const onClaim = vi.fn();
    const ref = createRef<NineGridRef>();
    render(<NineGrid ref={ref} cells={demoCells} prizeIndex={0} onClaim={onClaim} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => vi.advanceTimersByTime(10000));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledTimes(1);
    expect(onClaim.mock.calls[0]?.[0]?.id).toBe('c1');
  });
});
