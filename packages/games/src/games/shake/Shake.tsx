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
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useGameScale } from '../../core/use-game-scale';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { ShakeProps, ShakeRef } from './types';
import './shake.css';

export const Shake = forwardRef<ShakeRef, ShakeProps>(function Shake(
  {
    tapsToWin = 20,
    durationSec = 5,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onTap,
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
  const { t } = useI18n();
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(360, { enabled: scalePolicy === 'auto' });
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

  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const liveRegionId = useId();
  const countRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (endRef.current) clearTimeout(endRef.current);
    tickRef.current = null;
    endRef.current = null;
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  // 避免 tap() 達門檻 + endTimeout 同時結算造成雙觸發；一旦 finalize 過就 no-op
  const finalizedRef = useRef(false);
  const finalize = useCallback(
    (won: boolean) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      stopTimers();
      setState(won ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(won, countRef.current);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.();
      } else {
        onLose?.();
      }
    },
    [remaining, setState, setRemaining, onEnd, onWin, onLose, stopTimers],
  );

  const start = useCallback(() => {
    if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
    if (remaining <= 0) return;
    countRef.current = 0;
    finalizedRef.current = false;
    setCount(0);
    setTimeLeft(durationSec);
    setState('playing');
    onStart?.();
    stopTimers();
    // reducedMotion：shake 機制本身即動作，無法無動畫運作。直接結算為勝利讓 a11y 使用者可領取。
    if (reducedMotion) {
      countRef.current = tapsToWin;
      setCount(tapsToWin);
      finalize(true);
      return;
    }
    tickRef.current = setInterval(() => {
      setTimeLeft((x) => Math.max(0, x - 1));
    }, 1000);
    endRef.current = setTimeout(() => {
      finalize(countRef.current >= tapsToWin);
    }, durationSec * 1000);
  }, [
    state,
    remaining,
    durationSec,
    tapsToWin,
    reducedMotion,
    setState,
    onStart,
    finalize,
    stopTimers,
  ]);

  const tap = useCallback(() => {
    if (state !== 'playing') return;
    countRef.current += 1;
    setCount(countRef.current);
    onTap?.(countRef.current);
    if (countRef.current >= tapsToWin) {
      finalize(true);
    } else {
      haptic(10);
    }
  }, [state, tapsToWin, onTap, finalize]);

  const reset = useCallback(() => {
    stopTimers();
    countRef.current = 0;
    finalizedRef.current = false;
    setCount(0);
    setTimeLeft(durationSec);
    setState('idle');
  }, [durationSec, setState, stopTimers]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.();
  }, [state, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      tap,
      reset,
      claim,
      getState: () => state,
      getCount: () => count,
      getTimeLeft: () => timeLeft,
    }),
    [start, tap, reset, claim, state, count, timeLeft],
  );

  const pct = Math.min(100, (count / tapsToWin) * 100);
  const canTap = state === 'playing';
  const canStart =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-shake', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('shake.title')}
    >
      <div className="pk-shake__meta">
        <StateBadge state={state} />
        <span>
          {count}/{tapsToWin} · {timeLeft}s
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-shake__stage">
        <button
          type="button"
          className={`pk-shake__bottle${canTap ? ' pk-shake__bottle--shaking' : ''}${state === 'won' ? ' pk-shake__bottle--popped' : ''}`}
          onClick={canTap ? tap : canStart ? start : undefined}
          disabled={!canStart && !canTap}
          aria-label={canTap ? t('shake.tapFast', { count, total: tapsToWin }) : t('action.start')}
          aria-describedby={liveRegionId}
        >
          <svg className="pk-shake__svg" viewBox="0 0 100 160" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="pk-shake-glass" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--pk-bg-2)" />
                <stop offset="0.5" stopColor="color-mix(in oklch, var(--pk-bg-2) 70%, white 8%)" />
                <stop offset="1" stopColor="var(--pk-bg-2)" />
              </linearGradient>
              <linearGradient id="pk-shake-liq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="color-mix(in oklch, var(--pk-accent) 85%, white)" />
                <stop offset="1" stopColor="var(--pk-accent-2)" />
              </linearGradient>
            </defs>
            {/* 瓶身 */}
            <path
              d="M40 4 L60 4 L60 20 L68 28 L68 150 Q68 158 58 158 L42 158 Q32 158 32 150 L32 28 L40 20 Z"
              fill="url(#pk-shake-glass)"
              stroke="var(--pk-border-strong)"
              strokeWidth="1.5"
            />
            {/* 瓶蓋 */}
            <rect x="37" y="0" width="26" height="10" fill="var(--pk-accent-2)" rx="2" />
            <rect
              x="37"
              y="8"
              width="26"
              height="4"
              fill="color-mix(in oklch, var(--pk-accent-2) 60%, black)"
              rx="1"
            />
            {/* 液體（搖動時脈動） */}
            <rect
              className="pk-shake__liquid"
              x="34"
              y="60"
              width="32"
              height="90"
              fill="url(#pk-shake-liq)"
              rx="2"
            />
            {/* 亮光反射 */}
            <rect x="38" y="40" width="4" height="100" fill="rgba(255,255,255,0.25)" rx="1" />
            {/* 標籤 */}
            <rect
              x="32"
              y="78"
              width="36"
              height="40"
              fill="rgba(0,0,0,0.55)"
              rx="2"
              stroke="color-mix(in oklch, var(--pk-accent) 50%, transparent)"
              strokeWidth="0.5"
            />
            <text
              x="50"
              y="96"
              textAnchor="middle"
              fill="var(--pk-accent-fg)"
              fontSize="7"
              fontFamily="var(--pk-font-mono)"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {t('shake.shake')}
            </text>
            <text
              x="50"
              y="110"
              textAnchor="middle"
              fill="color-mix(in oklch, var(--pk-accent) 70%, white)"
              fontSize="11"
              fontFamily="var(--pk-font-display)"
              fontWeight="700"
            >
              {count}
            </text>
          </svg>
          <span className="pk-shake__hint">
            {canTap
              ? t('shake.tap')
              : state === 'idle'
                ? t('shake.tapToStart')
                : state === 'won'
                  ? '✓'
                  : '×'}
          </span>
        </button>
      </div>
      {/* biome-ignore lint/a11y/useFocusableInteractive: progressbar 為狀態顯示，非互動元素 */}
      <div
        className="pk-shake__bar"
        role="progressbar"
        aria-label={t('shake.tapProgress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="pk-shake__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-shake__cta">
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')}
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
