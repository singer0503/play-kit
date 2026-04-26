import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftBox } from '../GiftBox';
import { demoBoxes } from './test-utils';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('GiftBox — a11y', () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region', () => {
    render(<GiftBox boxes={demoBoxes} />, { wrapper: Wrapper });
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('aria-label prop 可覆寫預設 title', () => {
    render(<GiftBox boxes={demoBoxes} aria-label="Custom box" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom box' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<GiftBox boxes={demoBoxes} state={state} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
