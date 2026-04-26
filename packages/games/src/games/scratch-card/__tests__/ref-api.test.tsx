import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ScratchCard } from '../ScratchCard';
import type { ScratchCardRef } from '../types';
import { winPrize } from './test-utils';

const Wrapper = makeWrapper('en');

describe('ScratchCard — ref API', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('ref 暴露 scratch / revealAll / reset / claim / getState / getProgress', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} />, { wrapper: Wrapper });
    expect(typeof ref.current?.scratch).toBe('function');
    expect(typeof ref.current?.revealAll).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getProgress).toBe('function');
  });

  it('scratch(delta) 累加 progress', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} scratchGain={0.01} />, { wrapper: Wrapper });
    act(() => ref.current?.scratch(0.2));
    expect(ref.current?.getProgress()).toBeCloseTo(0.2);
  });

  it('revealAll 無視 threshold 直接 reveal', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} revealThreshold={0.9} />, { wrapper: Wrapper });
    act(() => ref.current?.revealAll());
    expect(ref.current?.getProgress()).toBe(1);
    expect(ref.current?.getState()).toBe('won');
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('claimed 狀態下 scratch no-op', () => {
    const onProgress = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} state="claimed" onProgress={onProgress} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.scratch(0.5));
    expect(onProgress).not.toHaveBeenCalled();
  });
});
