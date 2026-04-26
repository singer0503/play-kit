import { useI18n } from '../i18n/provider';
import { cx } from './cx';
import type { GameState } from './types';

const STATE_GLYPH: Record<GameState, string> = {
  idle: '○',
  playing: '◐',
  won: '★',
  lost: '×',
  claimed: '✓',
  cooldown: '◔',
};

export interface StateBadgeProps {
  state: GameState;
  className?: string;
}

// 給所有 game 共用的狀態 pill，文字走 i18n、符號走裝飾（aria-hidden）。
export function StateBadge({ state, className }: StateBadgeProps) {
  const { t } = useI18n();
  return (
    <span
      className={cx('pk-state-badge', `pk-state-badge--${state}`, className)}
      data-state={state}
    >
      <span className="pk-state-badge__glyph" aria-hidden="true">
        {STATE_GLYPH[state]}
      </span>
      <span className="pk-state-badge__label">{t(`state.${state}`)}</span>
    </span>
  );
}
