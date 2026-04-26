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
import { useGameScale } from '../../core/use-game-scale';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { SmashEggProps, SmashEggRef } from './types';
import './smash-egg.css';

export const SmashEgg = forwardRef<SmashEggRef, SmashEggProps>(function SmashEgg(
  {
    eggs,
    hammerDelayMs = 700,
    revealDelayMs = 700,
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
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(420, { enabled: scalePolicy === 'auto' });
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState,
    onChange: onStateChange,
  });

  const [picked, setPicked] = useState<number | null>(null);
  const [smashed, setSmashed] = useState(false);
  const liveRegionId = useId();
  const hammerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  useEffect(
    () => () => {
      if (hammerRef.current) clearTimeout(hammerRef.current);
      if (revealRef.current) clearTimeout(revealRef.current);
    },
    [],
  );

  const finalize = useCallback(
    (i: number) => {
      const prize = eggs[i];
      if (!prize) return;
      setSmashed(true);
      setState(prize.win ? 'won' : 'lost');
      onEnd?.(prize, i);
      if (prize.win) {
        haptic([80, 50, 100]);
        onWin?.(prize);
      } else {
        onLose?.(prize);
      }
    },
    [eggs, setState, onEnd, onWin, onLose],
  );

  const pick = useCallback(
    (i: number) => {
      if (state !== 'idle') return;
      if (i < 0 || i >= eggs.length) return;
      // 清掉上一輪可能殘留的 timer（Strict Mode / 外部受控 state 強推回 idle）
      if (hammerRef.current) clearTimeout(hammerRef.current);
      if (revealRef.current) clearTimeout(revealRef.current);
      setPicked(i);
      setSmashed(false);
      setState('playing');
      onStart?.();
      haptic(40);

      if (reducedMotion) {
        finalize(i);
        return;
      }

      hammerRef.current = setTimeout(() => {
        if (stateRef.current !== 'playing') return;
        setSmashed(true);
      }, hammerDelayMs);
      revealRef.current = setTimeout(() => {
        if (stateRef.current !== 'playing') return;
        finalize(i);
      }, hammerDelayMs + revealDelayMs);
    },
    [state, eggs.length, hammerDelayMs, revealDelayMs, reducedMotion, setState, onStart, finalize],
  );

  const reset = useCallback(() => {
    if (hammerRef.current) clearTimeout(hammerRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);
    setPicked(null);
    setSmashed(false);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || picked === null) return;
    const prize = eggs[picked];
    if (!prize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(prize);
  }, [state, picked, eggs, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      pick,
      reset,
      claim,
      getState: () => state,
      getPicked: () => picked,
    }),
    [pick, reset, claim, state, picked],
  );

  const currentPrize = picked !== null ? eggs[picked] : null;
  const announce =
    state === 'won' && currentPrize
      ? t('luckyWheel.announceWon', { prize: resolveLocalized(currentPrize.label, lang) })
      : state === 'lost'
        ? t('luckyWheel.announceLost')
        : '';

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-egg', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('smashEgg.title')}
    >
      <div className="pk-egg__meta">
        <StateBadge state={state} />
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-egg__row">
        {eggs.map((egg, i) => {
          const isPicked = picked === i;
          const isDim = picked !== null && picked !== i;
          const cracked = isPicked && smashed;
          const cls = [
            'pk-egg__stage',
            isPicked ? 'pk-egg__stage--picked' : '',
            isDim ? 'pk-egg__stage--dim' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              type="button"
              key={egg.id ?? `egg-${i}`}
              className={cls}
              onClick={() => pick(i)}
              disabled={state !== 'idle'}
              aria-label={`Egg ${i + 1}`}
              aria-describedby={liveRegionId}
            >
              <div
                className={`pk-egg__hammer${isPicked && !smashed ? ' pk-egg__hammer--swing' : ''}`}
                aria-hidden="true"
              >
                🔨
              </div>
              <div
                className={`pk-egg__egg${cracked ? ' pk-egg__egg--cracked' : ''}`}
                aria-hidden="true"
              >
                {cracked ? (
                  <span className={`pk-egg__reveal${egg.win ? '' : ' pk-egg__reveal--miss'}`}>
                    {resolveLocalized(egg.label, lang)}
                  </span>
                ) : (
                  <svg viewBox="0 0 80 100" width="80" height="100" aria-hidden="true">
                    <defs>
                      <linearGradient id={`pk-egg-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="oklch(0.85 0.12 80)" />
                        <stop offset="1" stopColor="oklch(0.68 0.18 40)" />
                      </linearGradient>
                    </defs>
                    <ellipse
                      cx="40"
                      cy="55"
                      rx="32"
                      ry="42"
                      fill={`url(#pk-egg-grad-${i})`}
                      stroke="var(--pk-border-strong)"
                      strokeWidth="1"
                    />
                    <ellipse cx="30" cy="35" rx="8" ry="14" fill="white" opacity="0.4" />
                  </svg>
                )}
              </div>
              <div className="pk-egg__plinth">{i + 1}</div>
            </button>
          );
        })}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-egg__cta">
        {state === 'won' && currentPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(currentPrize.label, lang)}
          </Button>
        ) : null}
        {state === 'lost' ? (
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
