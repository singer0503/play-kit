import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayKitProvider } from '../../i18n/provider';
import { StateBadge } from '../state-badge';
import type { GameState } from '../types';

const ALL_STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

describe('StateBadge', () => {
  it.each(ALL_STATES)('render 每個 state：%s（英文字典）', (s) => {
    render(
      <PlayKitProvider lang="en">
        <StateBadge state={s} />
      </PlayKitProvider>,
    );
    expect(screen.getByText(new RegExp(s === 'idle' ? 'Idle' : s, 'i'))).toBeInTheDocument();
  });

  it('繁中字典正確顯示', () => {
    render(
      <PlayKitProvider lang="zh-TW">
        <StateBadge state="won" />
      </PlayKitProvider>,
    );
    expect(screen.getByText('中獎')).toBeInTheDocument();
  });

  it('glyph 標記 aria-hidden', () => {
    const { container } = render(
      <PlayKitProvider lang="en">
        <StateBadge state="won" />
      </PlayKitProvider>,
    );
    const glyph = container.querySelector('.pk-state-badge__glyph');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
  });
});
