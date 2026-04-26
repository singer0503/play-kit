import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Quiz } from '../Quiz';
import type { QuizRef } from '../types';
import { demoQuestions } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Quiz — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ref 暴露 start / answer / reset / claim / getState / getScore / getQuestionIndex', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} />, { wrapper: Wrapper });
    expect(typeof ref.current?.start).toBe('function');
    expect(typeof ref.current?.answer).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getScore).toBe('function');
    expect(typeof ref.current?.getQuestionIndex).toBe('function');
  });

  it('answer 在非 playing 時 no-op', () => {
    const onAnswer = vi.fn();
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} onAnswer={onAnswer} />, { wrapper: Wrapper });
    act(() => ref.current?.answer(0));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('getQuestionIndex 從 0 開始遞增', () => {
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    expect(ref.current?.getQuestionIndex()).toBe(0);
    act(() => ref.current?.answer(0));
    act(() => vi.advanceTimersByTime(1300));
    expect(ref.current?.getQuestionIndex()).toBe(1);
  });
});
