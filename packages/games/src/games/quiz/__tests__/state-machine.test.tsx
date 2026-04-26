import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Quiz } from '../Quiz';
import type { QuizRef } from '../types';
import { demoQuestions } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Quiz — state machine', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('預設 state 為 idle', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} />, { wrapper: Wrapper });
    expect(ref.current?.getState()).toBe('idle');
  });

  it('start → playing', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getState()).toBe('playing');
  });

  it('達到 passScore → won', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} passScore={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(0));
    act(() => vi.advanceTimersByTime(1300));
    act(() => ref.current?.answer(1));
    act(() => vi.advanceTimersByTime(1300));
    act(() => ref.current?.answer(2));
    act(() => vi.advanceTimersByTime(1300));
    expect(ref.current?.getState()).toBe('won');
  });

  it('答錯超過 → lost', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} passScore={2} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(3));
    act(() => vi.advanceTimersByTime(1300));
    act(() => ref.current?.answer(3));
    act(() => vi.advanceTimersByTime(1300));
    act(() => ref.current?.answer(3));
    act(() => vi.advanceTimersByTime(1300));
    expect(ref.current?.getState()).toBe('lost');
  });

  it('won → claim → claimed', () => {
    const ref = createRef<QuizRef>();
    const firstQ = demoQuestions[0];
    if (!firstQ) throw new Error('missing');
    render(<Quiz ref={ref} questions={[firstQ]} passScore={1} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(0));
    act(() => vi.advanceTimersByTime(1300));
    act(() => ref.current?.claim());
    expect(ref.current?.getState()).toBe('claimed');
  });

  it('reset → idle', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.reset());
    expect(ref.current?.getState()).toBe('idle');
  });

  it('reducedMotion → feedbackMs=0 快速進下題', () => {
    stubMatchMedia(true);
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} passScore={1} feedbackMs={5000} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(0)); // 正解，scoreRef=1
    // 不 advance timer，feedbackMs=0 即是「下一 microtask」— 仍需推時器
    act(() => vi.advanceTimersByTime(0));
    expect(ref.current?.getQuestionIndex()).toBe(1);
  });
});
