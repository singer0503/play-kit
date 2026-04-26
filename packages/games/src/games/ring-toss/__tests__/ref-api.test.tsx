import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { RingToss } from '../RingToss';
import type { RingTossRef } from '../types';

const Wrapper = makeWrapper('en');

describe('RingToss — ref API', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('ref 暴露 start / toss / reset / claim / getState / getHits / getAttemptsLeft', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.toss).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getHits).toBe('function');
    expect(typeof ref.current?.getAttemptsLeft).toBe('function');
  });

  it('getHits 反映成功命中次數', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={10} tolerance={5} attempts={2} hitsToWin={2} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(ref.current?.getHits()).toBe(1);
  });

  it('getAttemptsLeft 反映剩餘投擲次數', () => {
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} attempts={3} hitsToWin={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getAttemptsLeft()).toBe(3);
  });

  it('toss 在非 playing 時 no-op', () => {
    const onToss = vi.fn();
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} onToss={onToss} />, { wrapper: Wrapper });
    act(() => ref.current?.toss());
    expect(onToss).not.toHaveBeenCalled();
  });
});
