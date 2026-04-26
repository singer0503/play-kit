import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ShakeDice } from '../ShakeDice';
import type { ShakeDiceRef } from '../types';

const Wrapper = makeWrapper('en');

describe('ShakeDice — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 roll / reset / claim / getState / getRemaining / getFaces', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.roll).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
    expect(typeof ref.current?.getFaces).toBe('function');
  });

  it('roll(faces) 覆寫 prop forcedFaces', () => {
    const onEnd = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[1, 1, 1]} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.roll([6, 6, 6]));
    act(() => vi.advanceTimersByTime(2000));
    expect(onEnd.mock.calls[0]?.[0]).toEqual([6, 6, 6]);
  });

  it('getFaces 於 won 後取得骰點', () => {
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} forcedFaces={[6, 6, 6]} />, { wrapper: Wrapper });
    act(() => ref.current?.roll());
    act(() => vi.advanceTimersByTime(2000));
    expect(ref.current?.getFaces()).toEqual([6, 6, 6]);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<ShakeDiceRef>();
    render(<ShakeDice ref={ref} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
