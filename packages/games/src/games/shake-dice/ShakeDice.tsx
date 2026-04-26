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
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { ShakeDiceProps, ShakeDiceRef } from './types';
import './shake-dice.css';

// pip 布局：1–6 面的 9-slot grid
const PATTERNS: Record<number, readonly number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function randomFaces(count: number, faces: number): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * faces));
}

function isTriple(faces: readonly number[]): boolean {
  if (faces.length === 0) return false;
  const first = faces[0];
  return faces.every((f) => f === first);
}

export const ShakeDice = forwardRef<ShakeDiceRef, ShakeDiceProps>(function ShakeDice(
  {
    diceCount = 3,
    faces: faceCount = 6,
    winThreshold = 14,
    tripleAlsoWins = false,
    shakeDurationMs = 1600,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    forcedFaces,
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
  const { t } = useI18n();
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(392, { enabled: scalePolicy === 'auto' });
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

  const [current, setCurrent] = useState<number[]>(() => Array(diceCount).fill(1));
  const liveRegionId = useId();
  const shuffleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  useEffect(
    () => () => {
      if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
    },
    [],
  );

  const finalize = useCallback(
    (finalFaces: readonly number[]) => {
      setCurrent([...finalFaces]);
      const sum = finalFaces.reduce((a, b) => a + b, 0);
      const won = sum >= winThreshold || (tripleAlsoWins && isTriple(finalFaces));
      setState(won ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(finalFaces, sum, won);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.(finalFaces, sum);
      } else {
        onLose?.(finalFaces, sum);
      }
    },
    [winThreshold, tripleAlsoWins, remaining, setState, setRemaining, onEnd, onWin, onLose],
  );

  const roll = useCallback(
    (forced?: readonly number[]) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;

      const targetFaces: number[] =
        forced && forced.length === diceCount
          ? [...forced]
          : forcedFaces && forcedFaces.length === diceCount
            ? [...forcedFaces]
            : randomFaces(diceCount, faceCount);

      setState('playing');
      onStart?.();
      haptic(20);

      if (reducedMotion) {
        finalize(targetFaces);
        return;
      }

      if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
      shuffleTimerRef.current = setInterval(() => {
        if (stateRef.current !== 'playing') return;
        setCurrent(randomFaces(diceCount, faceCount));
      }, 80);
      finalizeTimerRef.current = setTimeout(() => {
        if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
        if (stateRef.current !== 'playing') return;
        finalize(targetFaces);
      }, shakeDurationMs);
    },
    [
      state,
      remaining,
      diceCount,
      faceCount,
      forcedFaces,
      reducedMotion,
      shakeDurationMs,
      setState,
      onStart,
      finalize,
    ],
  );

  const reset = useCallback(() => {
    if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
    if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
    setCurrent(Array(diceCount).fill(1));
    setState('idle');
  }, [diceCount, setState]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    const sum = current.reduce((a, b) => a + b, 0);
    setState('claimed');
    haptic(40);
    onClaim?.(current, sum);
  }, [state, current, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      roll,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
      getFaces: () => current,
    }),
    [roll, reset, claim, state, remaining, current],
  );

  const shaking = state === 'playing';
  const sum = current.reduce((a, b) => a + b, 0);
  const canRoll =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-sd', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('shakeDice.title')}
    >
      <div className="pk-sd__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: {remaining}/{maxPlays} · ≥ {winThreshold}
          {tripleAlsoWins ? ` · ${t('shakeDice.tripleLabel')}` : ''}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-sd__stage">
        <div className={`pk-sd__cup${shaking ? ' pk-sd__cup--shaking' : ''}`}>
          <div className="pk-sd__row">
            {current.map((face, i) => {
              const active = new Set(PATTERNS[face] ?? []);
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: dice 位置由 i 固定決定
                  key={i}
                  className="pk-sd__die"
                  role="img"
                  aria-label={t('shakeDice.dieLabel', { index: i + 1, face })}
                >
                  {Array.from({ length: 9 }, (_, pipIdx) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: pip 位置固定
                      key={pipIdx}
                      className={`pk-sd__pip${active.has(pipIdx + 1) ? '' : ' pk-sd__pip--hidden'}`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="pk-sd__readout">
          <div className="pk-sd__label">{t('shakeDice.sumLabel')}</div>
          <div className={`pk-sd__sum${state === 'won' ? ' pk-sd__sum--win' : ''}`}>{sum}</div>
        </div>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-sd__cta">
        {state === 'idle' || state === 'lost' ? (
          <Button
            variant="primary"
            onClick={() => roll()}
            disabled={!canRoll}
            aria-describedby={liveRegionId}
          >
            {t('action.start')}
          </Button>
        ) : null}
        {state === 'playing' ? (
          <Button variant="primary" disabled>
            …
          </Button>
        ) : null}
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
