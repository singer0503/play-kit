import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Quiz } from '../Quiz';
import type { QuizRef } from '../types';
import { demoQuestions } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Quiz — outcome callbacks', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('onAnswer 傳入 (qIndex, selected, correct)', () => {
    const onAnswer = vi.fn();
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} onAnswer={onAnswer} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(0));
    expect(onAnswer).toHaveBeenCalledWith(0, 0, true);
  });

  it('onAnswer correct=false 當選錯答', () => {
    const onAnswer = vi.fn();
    const ref = createRef<QuizRef>();
    render(<Quiz ref={ref} questions={demoQuestions} onAnswer={onAnswer} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(3));
    expect(onAnswer).toHaveBeenCalledWith(0, 3, false);
  });

  it('過關 → onWin + onEnd(won=true)', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<QuizRef>();
    const q = demoQuestions[0];
    if (!q) throw new Error('missing');
    render(<Quiz ref={ref} questions={[q]} passScore={1} onWin={onWin} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(0));
    act(() => vi.advanceTimersByTime(1300));
    expect(onWin).toHaveBeenCalledWith(1);
    expect(onEnd).toHaveBeenCalledWith(1, 1, true);
  });

  it('未過關 → onLose + onEnd(won=false)', () => {
    const onLose = vi.fn();
    const ref = createRef<QuizRef>();
    const q = demoQuestions[0];
    if (!q) throw new Error('missing');
    render(<Quiz ref={ref} questions={[q]} passScore={1} onLose={onLose} />, { wrapper: Wrapper });
    act(() => ref.current?.start());
    act(() => ref.current?.answer(3)); // wrong
    act(() => vi.advanceTimersByTime(1300));
    expect(onLose).toHaveBeenCalledWith(0);
  });
});
