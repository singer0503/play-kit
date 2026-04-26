import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { NineGrid } from '../NineGrid';
import { demoCells, makeWrapper, stubMatchMedia } from './test-utils';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('NineGrid — a11y', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('根為 <section> 且有 aria-label', () => {
    render(<NineGrid cells={demoCells} />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: /nine-grid/i })).toBeInTheDocument();
  });

  it('中心 start 按鈕有 aria-label', () => {
    render(<NineGrid cells={demoCells} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('aria-label prop 可覆寫預設 title', () => {
    render(<NineGrid cells={demoCells} aria-label="Custom grid" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom grid' })).toBeInTheDocument();
  });

  it.each(STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<NineGrid cells={demoCells} state={state} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
