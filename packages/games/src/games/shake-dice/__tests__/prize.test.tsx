import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ShakeDice } from '../ShakeDice';
import type { ShakeDiceRef } from '../types';

const Wrapper = makeWrapper('en');

describe('ShakeDice — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onEnd(faces, sum, won=true)', () => {
    const onEnd = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(onEnd).toHaveBeenCalledWith([6, 6, 6], 18, true);
  });

  it('onWin 帶 faces + sum', () => {
    const onWin = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} onWin={onWin} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(onWin).toHaveBeenCalledWith([6, 6, 6], 18);
  });

  it('onLose 帶 faces + sum', () => {
    const onLose = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} winThreshold={14} forcedFaces={[1, 2, 3]} onLose={onLose} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(onLose).toHaveBeenCalledWith([1, 2, 3], 6);
  });

  it('onClaim 帶 faces + sum', () => {
    const onClaim = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith([6, 6, 6], 18);
  });
});
