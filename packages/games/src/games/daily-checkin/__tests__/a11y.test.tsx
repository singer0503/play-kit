import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../../core/types';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DailyCheckin } from '../DailyCheckin';

expect.extend(toHaveNoViolations);

const Wrapper = makeWrapper('en');
const A11Y_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('DailyCheckin — a11y', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('根容器有 role=region 與 aria-label', () => {
    render(<DailyCheckin rewards={[5, 10]} />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: /daily check-in/i })).toBeInTheDocument();
  });

  it('aria-label prop 可覆寫預設 title', () => {
    render(<DailyCheckin rewards={[5, 10]} aria-label="Custom checkin" />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: 'Custom checkin' })).toBeInTheDocument();
  });

  it.each(A11Y_STATES)('各 state 渲染下 axe 0 violation：%s', async (state) => {
    const { container } = render(<DailyCheckin rewards={[5, 10]} state={state} />, {
      wrapper: Wrapper,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('won 時 aria-live region 出現慶祝訊息', () => {
    const { container } = render(<DailyCheckin rewards={[5]} state="won" />, { wrapper: Wrapper });
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent?.length ?? 0).toBeGreaterThan(0);
  });
});
