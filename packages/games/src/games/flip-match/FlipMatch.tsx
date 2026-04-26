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
import type { FlipMatchCard, FlipMatchProps, FlipMatchRef } from './types';
import './flip-match.css';

const DEFAULT_SYMBOLS = ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐'] as const;

function buildDeck(symbols: readonly string[]): FlipMatchCard[] {
  const doubled = [...symbols, ...symbols].map((s, i) => ({
    id: i,
    symbol: s,
    flipped: false,
    matched: false,
  }));
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = doubled[i];
    const aj = doubled[j];
    if (!ai || !aj) continue;
    doubled[i] = aj;
    doubled[j] = ai;
  }
  return doubled;
}

export const FlipMatch = forwardRef<FlipMatchRef, FlipMatchProps>(function FlipMatch(
  {
    symbols = DEFAULT_SYMBOLS,
    matchDelayMs = 400,
    mismatchDelayMs = 900,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onMatch,
    onMismatch,
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
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(352, { enabled: scalePolicy === 'auto' });
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState,
    onChange: onStateChange,
  });

  const [cards, setCards] = useState<FlipMatchCard[]>(() => buildDeck(symbols));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSec, setTimeSec] = useState(0);
  const liveRegionId = useId();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  const stopTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  useEffect(
    () => () => {
      stopTick();
      if (pendingRef.current) clearTimeout(pendingRef.current);
    },
    [stopTick],
  );

  // 計時：state=playing 時每秒 +1
  useEffect(() => {
    if (state !== 'playing') return;
    tickRef.current = setInterval(() => setTimeSec((x) => x + 1), 1000);
    return () => stopTick();
  }, [state, stopTick]);

  // 全配對 → won
  useEffect(() => {
    if (state === 'playing' && cards.length > 0 && cards.every((c) => c.matched)) {
      setState('won');
      onEnd?.(moves, timeSec);
      onWin?.(moves, timeSec);
      haptic([60, 40, 80]);
    }
  }, [cards, state, moves, timeSec, setState, onEnd, onWin]);

  const flip = useCallback(
    (idx: number) => {
      if (state === 'won' || state === 'claimed' || state === 'cooldown') return;
      if (idx < 0 || idx >= cards.length) return;
      const card = cards[idx];
      if (!card || card.flipped || card.matched) return;
      if (flipped.length === 2) return; // wait for resolution

      if (state === 'idle') {
        setState('playing');
        onStart?.();
      }
      haptic(15);

      const nextCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
      setCards(nextCards);
      const nextFlipped = [...flipped, idx];
      setFlipped(nextFlipped);

      if (nextFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [a, b] = nextFlipped as [number, number];
        const ca = nextCards[a];
        const cb = nextCards[b];
        // reducedMotion：不需要等翻牌動畫，立刻結算
        const matchMs = reducedMotion ? 0 : matchDelayMs;
        const mismatchMs = reducedMotion ? 0 : mismatchDelayMs;
        if (ca && cb && ca.symbol === cb.symbol) {
          pendingRef.current = setTimeout(() => {
            if (stateRef.current !== 'playing') return;
            setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
            setFlipped([]);
            haptic(30);
            onMatch?.(ca.symbol);
          }, matchMs);
        } else {
          pendingRef.current = setTimeout(() => {
            if (stateRef.current !== 'playing') return;
            setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
            setFlipped([]);
            onMismatch?.();
          }, mismatchMs);
        }
      }
    },
    [
      state,
      cards,
      flipped,
      matchDelayMs,
      mismatchDelayMs,
      reducedMotion,
      setState,
      onStart,
      onMatch,
      onMismatch,
    ],
  );

  const reset = useCallback(() => {
    stopTick();
    if (pendingRef.current) clearTimeout(pendingRef.current);
    setCards(buildDeck(symbols));
    setFlipped([]);
    setMoves(0);
    setTimeSec(0);
    setState('idle');
  }, [symbols, stopTick, setState]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(moves, timeSec);
  }, [state, moves, timeSec, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      flip,
      reset,
      claim,
      getState: () => state,
      getMoves: () => moves,
      getTime: () => timeSec,
    }),
    [flip, reset, claim, state, moves, timeSec],
  );

  const announce = state === 'won' ? t('common.congrats') : '';

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-fm', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('flipMatch.title')}
    >
      <div className="pk-fm__meta">
        <StateBadge state={state} />
        <span>{t('flipMatch.moves', { count: moves, seconds: timeSec })}</span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-fm__grid">
        {cards.map((c, i) => (
          <button
            type="button"
            key={c.id}
            className={`pk-fm__card${c.flipped ? ' pk-fm__card--flipped' : ''}${c.matched ? ' pk-fm__card--matched' : ''}`}
            onClick={() => flip(i)}
            disabled={state === 'won' || state === 'claimed' || state === 'cooldown'}
            aria-label={
              c.flipped || c.matched ? c.symbol : t('flipMatch.cardLabel', { index: i + 1 })
            }
          >
            <div className="pk-fm__inner">
              <div className="pk-fm__back" aria-hidden="true">
                ?
              </div>
              <div className="pk-fm__front" aria-hidden="true">
                {c.symbol}
              </div>
            </div>
          </button>
        ))}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-fm__cta">
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')}
          </Button>
        ) : null}
        {state === 'claimed' ? (
          <Button variant="ghost" onClick={reset}>
            {t('action.playAgain')}
          </Button>
        ) : null}
      </div>
    </section>
  );
});
