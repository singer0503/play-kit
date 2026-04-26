import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Quiz } from '../Quiz';
import { demoQuestions } from './test-utils';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('Quiz — a11y', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region', () => {
    render(<Quiz questions={demoQuestions} />, { wrapper: Wrapper });
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('aria-label 可覆寫', () => {
    render(<Quiz questions={demoQuestions} aria-label="Custom quiz" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom quiz' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<Quiz state={state} questions={demoQuestions} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
