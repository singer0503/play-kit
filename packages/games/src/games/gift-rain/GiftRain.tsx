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
import type { DropKind, GiftRainDrop, GiftRainProps, GiftRainRef } from './types';
import './gift-rain.css';

const DEFAULT_PROBS: Record<DropKind, number> = { gold: 0.12, bomb: 0.16, red: 0.72 };
const DEFAULT_SCORE: Record<DropKind, number> = { red: 1, gold: 3, bomb: -2 };
const DEFAULT_DURATION_RANGE: readonly [number, number] = [2400, 3800];

function pickKind(probs: Record<DropKind, number>): DropKind {
  const r = Math.random();
  const gold = probs.gold ?? 0;
  const bomb = probs.bomb ?? 0;
  if (r < gold) return 'gold';
  if (r < gold + bomb) return 'bomb';
  return 'red';
}

const ICON_BY_KIND: Record<DropKind, string> = { red: '🧧', gold: '💰', bomb: '💣' };

export const GiftRain = forwardRef<GiftRainRef, GiftRainProps>(function GiftRain(
  {
    durationSec = 10,
    scoreToWin = 8,
    spawnIntervalMs = 380,
    dropDurationRangeMs = DEFAULT_DURATION_RANGE,
    kindProbabilities = DEFAULT_PROBS,
    scoreByKind = DEFAULT_SCORE,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onCatch,
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
  const scaleRef = useGameScale<HTMLElement>(352, { enabled: scalePolicy === 'auto' });
  const reducedMotion = useReducedMotion();

  const [state, setState] = useControlled<GameState>({
    controlled: stateProp,
    default: defaultState,
    onChange: onStateChange,
  });

  const [drops, setDrops] = useState<GiftRainDrop[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const liveRegionId = useId();
  const idRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  // 每一條 drop 都有自己的 despawn timer，需集中 cleanup 避免 unmount 後 setState
  const dropTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const finalizedRef = useRef(false);

  const clearDropTimers = useCallback(() => {
    for (const t of dropTimersRef.current.values()) clearTimeout(t);
    dropTimersRef.current.clear();
  }, []);

  const stopAll = useCallback(() => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    spawnRef.current = null;
    tickRef.current = null;
    clearDropTimers();
  }, [clearDropTimers]);

  useEffect(() => () => stopAll(), [stopAll]);

  const endGame = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    stopAll();
    setDrops([]);
    const finalScore = scoreRef.current;
    const won = finalScore >= scoreToWin;
    setState(won ? 'won' : 'lost');
    onEnd?.(finalScore, won);
    if (won) {
      haptic([100, 50, 150]);
      onWin?.(finalScore);
    } else {
      onLose?.(finalScore);
    }
  }, [scoreToWin, setState, onEnd, onWin, onLose, stopAll]);

  const start = useCallback(() => {
    if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
    scoreRef.current = 0;
    finalizedRef.current = false;
    setScore(0);
    setTimeLeft(durationSec);
    setDrops([]);
    setState('playing');
    onStart?.();

    // reducedMotion：遊戲本體即動畫、無法保留機制。直接結算為勝利（pro-user fallback）。
    if (reducedMotion) {
      scoreRef.current = scoreToWin;
      setScore(scoreToWin);
      finalizedRef.current = true;
      setState('won');
      onEnd?.(scoreToWin, true);
      haptic([100, 50, 150]);
      onWin?.(scoreToWin);
      return;
    }

    const [minDur, maxDur] = dropDurationRangeMs;
    spawnRef.current = setInterval(() => {
      const kind = pickKind(kindProbabilities);
      const dropId = ++idRef.current;
      const drop: GiftRainDrop = {
        id: dropId,
        kind,
        left: 6 + Math.random() * 88,
        durationMs: minDur + Math.random() * (maxDur - minDur),
      };
      setDrops((prev) => [...prev, drop]);
      // drop 自動清除（動畫結束後）；timer 需追蹤以便 unmount/reset cleanup
      const tid = setTimeout(() => {
        dropTimersRef.current.delete(dropId);
        setDrops((prev) => prev.filter((d) => d.id !== dropId));
      }, drop.durationMs);
      dropTimersRef.current.set(dropId, tid);
    }, spawnIntervalMs);

    // 純 tick，不在 updater 內做副作用
    tickRef.current = setInterval(() => {
      setTimeLeft((x) => Math.max(0, x - 1));
    }, 1000);
  }, [
    state,
    durationSec,
    dropDurationRangeMs,
    kindProbabilities,
    spawnIntervalMs,
    scoreToWin,
    reducedMotion,
    setState,
    onStart,
    onEnd,
    onWin,
  ]);

  // 時間歸零時結算；解耦於 setTimeLeft updater 以避 Strict Mode double-fire
  useEffect(() => {
    if (state === 'playing' && timeLeft === 0) endGame();
  }, [state, timeLeft, endGame]);

  // drops ref：tap 需同步讀「最新」drop 清單來判斷是否存在，避免 setDrops updater
  // 雙觸發造成 scoreRef / onCatch 被呼叫兩次（Strict Mode 反模式）
  const dropsRef = useLatestRef(drops);
  const tap = useCallback(
    (id: number) => {
      if (state !== 'playing') return;
      const drop = dropsRef.current.find((d) => d.id === id);
      if (!drop) return;
      const delta = scoreByKind[drop.kind] ?? 0;
      scoreRef.current = Math.max(0, scoreRef.current + delta);
      setScore(scoreRef.current);
      onCatch?.(drop, delta);
      haptic(drop.kind === 'bomb' ? [20, 20, 20] : 20);
      // 清掉一個 drop 的 despawn timer，避免 cleanup 時多做一次 setState
      const tid = dropTimersRef.current.get(id);
      if (tid) {
        clearTimeout(tid);
        dropTimersRef.current.delete(id);
      }
      setDrops((prev) => prev.filter((d) => d.id !== id));
    },
    [state, scoreByKind, onCatch],
  );

  const reset = useCallback(() => {
    stopAll();
    scoreRef.current = 0;
    finalizedRef.current = false;
    setDrops([]);
    setScore(0);
    setTimeLeft(durationSec);
    setState('idle');
  }, [durationSec, setState, stopAll]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(scoreRef.current);
  }, [state, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      tap,
      reset,
      claim,
      getState: () => state,
      getScore: () => score,
      getTimeLeft: () => timeLeft,
    }),
    [start, tap, reset, claim, state, score, timeLeft],
  );

  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';
  const showOverlay =
    state === 'idle' || state === 'won' || state === 'lost' || state === 'claimed';

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-rain', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('giftRain.title')}
    >
      <div className="pk-rain__meta">
        <StateBadge state={state} />
        <span>
          {score}/{scoreToWin} · {timeLeft}s
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-rain__stage">
        {state === 'playing'
          ? drops.map((d) => (
              <button
                type="button"
                key={d.id}
                className={`pk-rain__drop pk-rain__drop--${d.kind}`}
                style={{
                  left: `${d.left}%`,
                  animationDuration: `${d.durationMs}ms`,
                }}
                onClick={() => tap(d.id)}
                aria-label={t('giftRain.dropLabel', { kind: d.kind })}
              >
                {ICON_BY_KIND[d.kind]}
              </button>
            ))
          : null}
        {showOverlay ? (
          <div className="pk-rain__overlay">
            {state === 'idle' ? (
              <>
                <h3>{t('giftRain.title')}</h3>
                <p>{t('giftRain.intro', { target: scoreToWin, seconds: durationSec })}</p>
                <div className="pk-rain__legend">
                  <span>🧧 +{scoreByKind.red ?? 1}</span>
                  <span style={{ color: 'var(--pk-accent)' }}>💰 +{scoreByKind.gold ?? 3}</span>
                  <span style={{ color: 'var(--pk-lose)' }}>💣 {scoreByKind.bomb ?? -2}</span>
                </div>
                <Button variant="primary" onClick={start}>
                  {t('action.start')}
                </Button>
              </>
            ) : null}
            {(state === 'won' || state === 'lost') && (
              <>
                <h3>{state === 'won' ? t('common.congrats') : t('common.soClose')}</h3>
                <p>
                  {score} / {scoreToWin}
                </p>
              </>
            )}
            {state === 'claimed' ? (
              <>
                <h3>{t('state.claimed')} ✓</h3>
                <p>
                  {score} / {scoreToWin}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-rain__cta">
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
      </div>
    </section>
  );
});
