import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { SmashEgg } from '../SmashEgg';
import type { SmashEggRef } from '../types';
import { demoEggs } from './test-utils';

const Wrapper = makeWrapper('en');

describe('SmashEgg — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 pick / reset / claim / getState / getPicked', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    expect(typeof ref.current?.pick).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getPicked).toBe('function');
  });

  it('getPicked 反映選擇', () => {
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(2));
    expect(ref.current?.getPicked()).toBe(2);
  });

  it('playing 中第二次 pick no-op', () => {
    const onStart = vi.fn();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} onStart={onStart} />, { wrapper: Wrapper });
    act(() => ref.current?.pick(0));
    act(() => ref.current?.pick(1));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<SmashEggRef>();
    render(<SmashEgg ref={ref} eggs={demoEggs} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
