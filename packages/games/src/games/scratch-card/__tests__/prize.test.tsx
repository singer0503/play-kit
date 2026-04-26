import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ScratchCard } from '../ScratchCard';
import type { ScratchCardRef } from '../types';
import { losePrize, winPrize } from './test-utils';

const Wrapper = makeWrapper('en');

describe('ScratchCard — outcome callbacks', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('onProgress 每次 scratch 呼叫一次', () => {
    const onProgress = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} onProgress={onProgress} scratchGain={0.1} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.scratch());
    act(() => ref.current?.scratch());
    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it('onReveal 在 threshold 到達時 fire 一次 + 傳入 prize', () => {
    const onReveal = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(
      <ScratchCard
        ref={ref}
        prize={winPrize}
        revealThreshold={0.5}
        scratchGain={0.1}
        onReveal={onReveal}
      />,
      { wrapper: Wrapper },
    );
    for (let i = 0; i < 6; i++) act(() => ref.current?.scratch());
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onReveal).toHaveBeenCalledWith(winPrize);
  });

  it('onStart 僅觸發一次（即使多次 scratch）', () => {
    const onStart = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} onStart={onStart} scratchGain={0.1} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.scratch());
    act(() => ref.current?.scratch());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('lose prize → onReveal 仍觸發', () => {
    const onReveal = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={losePrize} onReveal={onReveal} />, { wrapper: Wrapper });
    act(() => ref.current?.revealAll());
    expect(onReveal).toHaveBeenCalledWith(losePrize);
  });

  it('onClaim 帶 prize', () => {
    const onClaim = vi.fn();
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.revealAll());
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith(winPrize);
  });
});
