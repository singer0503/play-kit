import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Shake } from '../Shake';
import type { ShakeRef } from '../types';

const Wrapper = makeWrapper('en');

describe('Shake — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 start / tap / reset / claim / getState / getCount / getTimeLeft', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.tap).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getCount).toBe('function');
    expect(typeof ref.current?.getTimeLeft).toBe('function');
  });

  it('getCount 隨 tap 增加', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={10} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.tap());
    act(() => ref.current?.tap());
    expect(ref.current?.getCount()).toBe(2);
  });

  it('tap 在非 playing 時 no-op', () => {
    const onTap = vi.fn();
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} onTap={onTap} />, { wrapper: Wrapper });
    act(() => ref.current?.tap());
    expect(onTap).not.toHaveBeenCalled();
  });

  it('reset 清空 count', () => {
    const ref = createRef<ShakeRef>();
    render(<Shake ref={ref} tapsToWin={100} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.tap());
    act(() => ref.current?.reset());
    expect(ref.current?.getCount()).toBe(0);
  });
});
