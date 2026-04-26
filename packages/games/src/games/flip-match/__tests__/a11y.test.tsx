import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { FlipMatch } from '../FlipMatch';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('FlipMatch — a11y', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region 與 aria-label', () => {
    render(<FlipMatch />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: /flip/i })).toBeInTheDocument();
  });

  it('aria-label prop 可覆寫預設 title', () => {
    render(<FlipMatch aria-label="Custom flip" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom flip' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<FlipMatch state={state} />, { wrapper: Wrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
