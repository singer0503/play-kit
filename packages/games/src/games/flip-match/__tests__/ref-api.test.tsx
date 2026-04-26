import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { FlipMatch } from '../FlipMatch';
import type { FlipMatchRef } from '../types';

const Wrapper = makeWrapper('en');

describe('FlipMatch — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 flip / reset / claim / getState / getMoves / getTime', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.flip).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getMoves).toBe('function');
    expect(typeof ref.current?.getTime).toBe('function');
  });

  it('flip(invalidIndex) no-op', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A']} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(999));
    act(() => ref.current?.flip(-1));
    expect(ref.current?.getState()).toBe('idle');
  });

  it('claim 在非 won state 時 no-op', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('flip 第三張在等候期間 no-op', () => {
    const ref = createRef<FlipMatchRef>();
    render(<FlipMatch ref={ref} symbols={['A', 'B']} />, { wrapper: Wrapper });
    act(() => ref.current?.flip(0));
    act(() => ref.current?.flip(2));
    // 尚未 advanceTimers，第三張進來應 no-op
    act(() => ref.current?.flip(3));
    expect(ref.current?.getMoves()).toBe(1);
  });
});
