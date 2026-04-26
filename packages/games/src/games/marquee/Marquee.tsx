'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Button } from '../../core/button';
import { Confetti } from '../../core/confetti';
import { haptic } from '../../core/haptic';
import { resolveLocalized } from '../../core/i18n-utils';
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useLatestRef } from '../../core/use-latest-ref';
import { pickPrize } from '../../core/use-prize';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { MarqueePrize, MarqueeProps, MarqueeRef } from './types';
import './marquee.css';

export const Marquee = forwardRef<MarqueeRef, MarqueeProps>(function Marquee(
  {
    prizes,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    prizeIndex = -1,
    loops = 3,
    stepInterval = 70,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onEnd,
    onWin,
    onLose,
    onClaim,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const { t, lang } = useI18n();
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState,
    onChange: onStateChange,
  });
  const [remaining, setRemaining] = useControlled<number>({
    controlled: remainingProp,
    default: defaultRemaining ?? maxPlays,
    onChange: onRemainingChange,
  });

  const [activeIdx, setActiveIdx] = useState(-1);
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const liveRegionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const finalize = useCallback(
    (target: MarqueePrize, idx: number) => {
      setWinIdx(idx);
      setState(target.win ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(target, idx);
      if (target.win) {
        haptic([80, 40, 120]);
        onWin?.(target);
      } else {
        onLose?.(target);
      }
    },
    [remaining, setState, setRemaining, onEnd, onWin, onLose],
  );

  const start = useCallback(
    (forcedIndex?: number) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;
      if (prizes.length === 0) return;

      const idx =
        forcedIndex !== undefined && forcedIndex >= 0
          ? forcedIndex
          : prizeIndex >= 0
            ? prizeIndex
            : pickPrize(prizes);
      const safeIdx = Math.min(Math.max(idx, 0), prizes.length - 1);
      const target = prizes[safeIdx];
      if (!target) return;

      setWinIdx(null);
      setState('playing');
      onStart?.();
      haptic(20);

      if (reducedMotion) {
        setActiveIdx(safeIdx);
        finalize(target, safeIdx);
        return;
      }

      let step = 0;
      const totalSteps = prizes.length * loops + safeIdx;
      let delay = stepInterval;
      const run = () => {
        setActiveIdx(step % prizes.length);
        step++;
        if (step > totalSteps) {
          finalize(target, safeIdx);
          return;
        }
        if (step > totalSteps - prizes.length) delay += 40;
        else if (step > totalSteps - prizes.length * 2) delay += 12;
        timerRef.current = setTimeout(() => {
          if (stateRef.current !== 'playing') return;
          run();
        }, delay);
      };
      run();
    },
    [
      state,
      remaining,
      prizes,
      prizeIndex,
      loops,
      stepInterval,
      reducedMotion,
      setState,
      onStart,
      finalize,
    ],
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIdx(-1);
    setWinIdx(null);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || winIdx === null) return;
    const prize = prizes[winIdx];
    if (!prize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(prize);
  }, [state, winIdx, prizes, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
    }),
    [start, reset, claim, state, remaining],
  );

  const canStart =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const currentPrize = winIdx !== null ? prizes[winIdx] : null;
  const announce =
    state === 'won' && currentPrize
      ? t('luckyWheel.announceWon', { prize: resolveLocalized(currentPrize.label, lang) })
      : state === 'lost'
        ? t('luckyWheel.announceLost')
        : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-mq', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('marquee.title')}
    >
      <div className="pk-mq__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: <b>{remaining}</b>/{maxPlays}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-mq__board">
        <div className="pk-mq__track">
          {prizes.map((p, i) => {
            const isActive = activeIdx === i;
            const isWin = winIdx === i && state !== 'playing';
            const cls = [
              'pk-mq__cell',
              isActive ? 'pk-mq__cell--active' : '',
              isWin ? (p.win ? 'pk-mq__cell--win' : 'pk-mq__cell--lose') : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={p.id ?? resolveLocalized(p.label, lang)} className={cls}>
                {p.icon ? <div className="pk-mq__cell-icon">{p.icon}</div> : null}
                <div className="pk-mq__cell-label">{resolveLocalized(p.label, lang)}</div>
              </div>
            );
          })}
        </div>
        <Button
          variant="primary"
          onClick={() => start()}
          disabled={!canStart}
          aria-describedby={liveRegionId}
        >
          {state === 'playing' ? '…' : t('action.start')}
        </Button>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-mq__cta">
        {state === 'won' && currentPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(currentPrize.label, lang)}
          </Button>
        ) : null}
        {state === 'lost' && remaining > 0 ? (
          <Button variant="ghost" onClick={reset}>
            {t('action.tryAgain')}
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
