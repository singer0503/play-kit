import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ScratchCard } from '../ScratchCard';
import type { ScratchCardRef } from '../types';
import { losePrize, winPrize } from './test-utils';

const Wrapper = makeWrapper('en');

describe('ScratchCard — state machine', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('預設 state 為 idle', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('scratch 第一次 → playing', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} scratchGain={0.1} />, { wrapper: Wrapper });
    act(() => ref.current?.scratch());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('progress 達 threshold → win / lose', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} revealThreshold={0.5} scratchGain={0.1} />, {
      wrapper: Wrapper,
    });
    for (let i = 0; i < 6; i++) act(() => ref.current?.scratch());
    expect(ref.current?.getState()).toBe('won');
  });

  it('lose prize → lost', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={losePrize} revealThreshold={0.5} scratchGain={0.1} />, {
      wrapper: Wrapper,
    });
    for (let i = 0; i < 6; i++) act(() => ref.current?.scratch());
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} />, { wrapper: Wrapper });
    act(() => ref.current?.revealAll());
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle 且 progress 歸零', () => {
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} />, { wrapper: Wrapper });
    act(() => ref.current?.revealAll());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
    expect(ref.current?.getProgress()).toBe(0);
  });

  it('reducedMotion → scratch 一次即 reveal', () => {
    stubMatchMedia(true);
    const ref = createRef<ScratchCardRef>();
    render(<ScratchCard ref={ref} prize={winPrize} scratchGain={0.01} />, { wrapper: Wrapper });
    act(() => ref.current?.scratch());
    expect(ref.current?.getState()).toBe('won');
  });
});
