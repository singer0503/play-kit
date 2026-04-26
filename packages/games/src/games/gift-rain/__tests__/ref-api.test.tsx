import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftRain } from '../GiftRain';
import type { GiftRainRef } from '../types';

const Wrapper = makeWrapper('en');

describe('GiftRain — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 start / tap / reset / claim / getState / getScore / getTimeLeft', () => {
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.tap).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getScore).toBe('function');
    expect(typeof ref.current?.getTimeLeft).toBe('function');
  });

  it('tap 在 non-playing 時 no-op', () => {
    const onCatch = vi.fn();
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} onCatch={onCatch} />, { wrapper: Wrapper });
    act(() => ref.current?.tap(999));
    expect(onCatch).not.toHaveBeenCalled();
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('getTimeLeft 反映當前剩餘時間', () => {
    const ref = createRef<GiftRainRef>();
    render(<GiftRain ref={ref} durationSec={10} />, { wrapper: Wrapper });
    expect(ref.current?.getTimeLeft()).toBe(10);
  });
});
