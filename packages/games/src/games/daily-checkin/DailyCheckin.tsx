'use client';

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { Button } from '../../core/button';
import { Confetti } from '../../core/confetti';
import { haptic } from '../../core/haptic';
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { DailyCheckinProps, DailyCheckinRef } from './types';
import './daily-checkin.css';

const DEFAULT_REWARDS = [5, 10, 15, 20, 30, 50, 100] as const;

function totalOf(checked: readonly boolean[], rewards: readonly number[]): number {
  return checked.reduce((sum, c, i) => sum + (c ? (rewards[i] ?? 0) : 0), 0);
}

export const DailyCheckin = forwardRef<DailyCheckinRef, DailyCheckinProps>(function DailyCheckin(
  {
    rewards = DEFAULT_REWARDS,
    defaultChecked,
    checked: checkedProp,
    onCheckedChange,
    checkDelayMs = 700,
    state: stateProp,
    defaultState,
    onStateChange,
    onCheckIn,
    onEnd,
    onWin,
    onClaim,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState ?? 'playing',
    onChange: onStateChange,
  });

  const [checked, setChecked] = useControlled<readonly boolean[]>({
    controlled: checkedProp,
    default: defaultChecked ?? Array(rewards.length).fill(false),
    onChange: onCheckedChange,
  });

  const liveRegionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const today = checked.findIndex((c) => !c);

  const doCheck = useCallback(
    (idx: number) => {
      const next = checked.map((c, i) => (i === idx ? true : c));
      setChecked(next);
      onCheckIn?.(idx, rewards[idx] ?? 0);
      haptic([30, 20, 50]);
      if (idx === rewards.length - 1) {
        const total = totalOf(next, rewards);
        setState('won');
        onEnd?.(total);
        onWin?.(total);
      }
    },
    [checked, rewards, setChecked, setState, onCheckIn, onEnd, onWin],
  );

  const checkIn = useCallback(() => {
    if (state === 'claimed' || state === 'cooldown') return;
    if (today < 0) return;
    const idx = today;

    if (reducedMotion) {
      doCheck(idx);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    // delay 期間若外部 setState('cooldown'|'claimed') 需早退避免誤 check
    timerRef.current = setTimeout(() => {
      if (stateRef.current === 'cooldown' || stateRef.current === 'claimed') return;
      doCheck(idx);
    }, checkDelayMs);
  }, [state, today, reducedMotion, checkDelayMs, doCheck]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setChecked(Array(rewards.length).fill(false));
    setState('playing');
  }, [rewards.length, setChecked, setState]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    const total = totalOf(checked, rewards);
    setState('claimed');
    haptic(40);
    onClaim?.(total);
  }, [state, checked, rewards, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      checkIn,
      reset,
      claim,
      getState: () => state,
      getChecked: () => checked,
      getTotalPoints: () => totalOf(checked, rewards),
    }),
    [checkIn, reset, claim, state, checked, rewards],
  );

  const streak = checked.filter(Boolean).length;
  const canCheck = state === 'playing' && today >= 0;
  const announce = state === 'won' ? t('common.congrats') : '';
  const bonusIndex = rewards.length - 1;

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-dc', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('dailyCheckin.title')}
    >
      <div className="pk-dc__meta">
        <StateBadge state={state} />
        <span>{t('dailyCheckin.streak', { days: streak })}</span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-dc__header">
        <div className="pk-dc__title">{t('dailyCheckin.title')}</div>
        <div className="pk-dc__sub">{t('dailyCheckin.bonusOnDay', { day: rewards.length })}</div>
      </div>
      <div className="pk-dc__grid">
        {rewards.map((r, i) => {
          const isDone = checked[i];
          const isToday = i === today;
          const isBonus = i === bonusIndex;
          const cls = [
            'pk-dc__day',
            isDone ? 'pk-dc__day--done' : '',
            isToday ? 'pk-dc__day--today' : '',
            isBonus ? 'pk-dc__day--bonus' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: day position fixed by i
            <div key={i} className={cls}>
              <div className="pk-dc__day-label">{t('dailyCheckin.dayLabel', { index: i + 1 })}</div>
              <div className="pk-dc__day-reward">{isBonus ? '🎁' : isDone ? '✓' : `+${r}`}</div>
              <div className="pk-dc__day-amt">
                {isBonus ? t('dailyCheckin.bonus') : `${r} ${t('dailyCheckin.points')}`}
              </div>
            </div>
          );
        })}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-dc__cta">
        {canCheck ? (
          <Button variant="primary" onClick={checkIn}>
            {t('dailyCheckin.checkInAction', { points: rewards[today] ?? 0 })}
          </Button>
        ) : null}
        {!canCheck && state === 'playing' && today < 0 ? (
          <Button variant="ghost" disabled>
            {t('common.todayDone')}
          </Button>
        ) : null}
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {totalOf(checked, rewards)} pts
          </Button>
        ) : null}
        {state === 'claimed' ? (
          <Button variant="ghost" disabled>
            {t('state.claimed')} ✓
          </Button>
        ) : null}
      </div>
    </section>
  );
});
