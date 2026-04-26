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
import { useAnimationLoop } from '../../core/use-animation-loop';
import { useControlled } from '../../core/use-controlled';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { RingTossProps, RingTossRef } from './types';
import './ring-toss.css';

function RingSvg({ color }: { color: string }) {
  return (
    <svg width="52" height="20" viewBox="0 0 52 20" aria-hidden="true" focusable="false">
      <ellipse cx="26" cy="10" rx="23" ry="7" fill="none" stroke={color} strokeWidth="4" />
      <ellipse
        cx="26"
        cy="10"
        rx="23"
        ry="7"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />
    </svg>
  );
}

export const RingToss = forwardRef<RingTossRef, RingTossProps>(function RingToss(
  {
    attempts = 3,
    hitsToWin = 2,
    pegX = 50,
    tolerance = 9,
    sliderSpeed = 1.1,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onToss,
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
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState,
    onChange: onStateChange,
  });

  const [hits, setHits] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(attempts);
  // 飛行中的 ring 狀態（CSS 變數驅動 keyframe）
  const [flying, setFlying] = useState<{ from: number; hit: boolean } | null>(null);
  const liveRegionId = useId();
  const dirRef = useRef(1);
  const posRef = useRef(10);
  const hitsRef = useRef(0);
  const attemptsRef = useRef(attempts);
  const sliderRef = useRef<HTMLDivElement>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  // cleanup pending 飛行動畫 timer（避免 unmount 後 setState warning）
  useEffect(
    () => () => {
      if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    },
    [],
  );

  // slider rAF：playing 且沒在飛行中時跑；useAnimationLoop 自動處理 cleanup / reducedMotion
  useAnimationLoop({
    enabled: state === 'playing' && !flying,
    reducedMotion,
    onFrame: () => {
      let next = posRef.current + dirRef.current * sliderSpeed;
      if (next > 94) {
        next = 94;
        dirRef.current = -1;
      } else if (next < 6) {
        next = 6;
        dirRef.current = 1;
      }
      posRef.current = next;
      if (sliderRef.current) sliderRef.current.style.left = `${next}%`;
    },
  });

  const start = useCallback(() => {
    if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    hitsRef.current = 0;
    attemptsRef.current = attempts;
    dirRef.current = 1;
    posRef.current = 10;
    if (sliderRef.current) sliderRef.current.style.left = '10%';
    setHits(0);
    setAttemptsLeft(attempts);
    setFlying(null);
    setState('playing');
    onStart?.();
  }, [state, attempts, setState, onStart]);

  const endGame = useCallback(
    (finalHits: number) => {
      const won = finalHits >= hitsToWin;
      setState(won ? 'won' : 'lost');
      onEnd?.(finalHits, won);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.(finalHits);
      } else {
        onLose?.(finalHits);
      }
    },
    [hitsToWin, setState, onEnd, onWin, onLose],
  );

  // 結算一次飛行：更新 hits / attempts，耗盡 attempts 時 endGame。
  // 用 ref 追蹤 attemptsRef 才能在 setState updater 之外做副作用，避免 StrictMode 雙觸發。
  const settleToss = useCallback(
    (hit: boolean) => {
      if (hit) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
      }
      attemptsRef.current -= 1;
      setAttemptsLeft(attemptsRef.current);
      if (attemptsRef.current <= 0) endGame(hitsRef.current);
    },
    [endGame],
  );

  const toss = useCallback(() => {
    if (state !== 'playing' || flying) return;
    const currentPos = posRef.current;
    const hit = Math.abs(currentPos - pegX) < tolerance;
    onToss?.(currentPos, hit);
    haptic(hit ? [40, 30, 60] : 20);

    if (reducedMotion) {
      settleToss(hit);
      return;
    }

    // 設 flying 同時凍結 slider rAF（enabled 變 false 自動 cleanup）
    setFlying({ from: currentPos, hit });
    // 飛行動畫 700ms 後結算；cleanup 在 useEffect 處理
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    flyTimerRef.current = setTimeout(() => {
      flyTimerRef.current = null;
      if (stateRef.current !== 'playing') return;
      setFlying(null);
      settleToss(hit);
    }, 700);
  }, [state, flying, pegX, tolerance, reducedMotion, onToss, settleToss]);

  const reset = useCallback(() => {
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    hitsRef.current = 0;
    attemptsRef.current = attempts;
    posRef.current = 10;
    if (sliderRef.current) sliderRef.current.style.left = '10%';
    setHits(0);
    setFlying(null);
    setAttemptsLeft(attempts);
    setState('idle');
  }, [attempts, setState]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(hitsRef.current);
  }, [state, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      toss,
      reset,
      claim,
      getState: () => state,
      getHits: () => hits,
      getAttemptsLeft: () => attemptsLeft,
    }),
    [start, toss, reset, claim, state, hits, attemptsLeft],
  );

  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-rt', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('ringToss.title')}
    >
      <div className="pk-rt__meta">
        <StateBadge state={state} />
        <span>{t('ringToss.hits', { hits, total: hitsToWin, left: attemptsLeft })}</span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-rt__stage">
        <div className="pk-rt__sky" aria-hidden="true" />
        <div className="pk-rt__peg-base" aria-hidden="true" />
        <div className="pk-rt__peg" aria-hidden="true" />
        <div className="pk-rt__peg-cap" aria-hidden="true" />
        {state === 'playing' ? <div className="pk-rt__target-zone" aria-hidden="true" /> : null}
        {state === 'playing' && !flying ? (
          <div
            ref={sliderRef}
            className="pk-rt__ring pk-rt__ring--sliding"
            style={{ left: '10%' }}
            aria-hidden="true"
          >
            <RingSvg color="var(--pk-accent)" />
          </div>
        ) : null}
        {flying ? (
          <div
            className={`pk-rt__ring pk-rt__ring--flying${flying.hit ? ' pk-rt__ring--flying-hit' : ' pk-rt__ring--flying-miss'}`}
            style={
              {
                '--from': `${flying.from}%`,
                '--to': `${pegX}%`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            <RingSvg color={flying.hit ? 'var(--pk-accent)' : 'var(--pk-lose)'} />
          </div>
        ) : null}
        {flying?.hit ? (
          <div className="pk-rt__flash" aria-hidden="true">
            HIT!
          </div>
        ) : null}
        {hits > 0
          ? Array.from({ length: hits }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: hit 數量由 i 固定
                key={i}
                className="pk-rt__ring pk-rt__ring--landed"
                style={{ left: `${pegX}%`, bottom: `${38 + i * 8}px` }}
                aria-hidden="true"
              >
                <RingSvg
                  color={
                    ['var(--pk-accent)', 'var(--pk-accent-2)', 'var(--pk-accent-3)'][i % 3] ??
                    'var(--pk-accent)'
                  }
                />
              </div>
            ))
          : null}
        {state === 'idle' ? (
          <div className="pk-rt__overlay">
            <div className="pk-rt__title">{t('ringToss.title')}</div>
            <div className="pk-rt__sub">
              {t('action.start').toUpperCase()} · {t('ringToss.aim')}
            </div>
          </div>
        ) : null}
        <div className="pk-rt__hits">{t('ringToss.hitsBadge', { n: hits })}</div>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-rt__cta">
        {state === 'idle' ? (
          <Button variant="primary" onClick={start}>
            {t('action.start')}
          </Button>
        ) : null}
        {state === 'playing' ? (
          <Button variant="primary" onClick={toss}>
            {t('ringToss.toss')}
          </Button>
        ) : null}
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')}
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
