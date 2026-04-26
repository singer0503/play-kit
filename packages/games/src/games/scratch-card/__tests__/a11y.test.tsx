import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { ScratchCard } from '../ScratchCard';
import { winPrize } from './test-utils';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('ScratchCard — a11y', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region', () => {
    render(<ScratchCard prize={winPrize} />, { wrapper: Wrapper });
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('aria-label 可覆寫', () => {
    render(<ScratchCard prize={winPrize} aria-label="Custom sc" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom sc' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<ScratchCard prize={winPrize} state={state} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
