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
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { LottoRollProps, LottoRollRef, LottoWinChecker } from './types';
import './lotto-roll.css';

const defaultWinChecker: LottoWinChecker = (drawn) =>
  drawn.filter((n) => n % 7 === 0 || n % 11 === 0).length >= 2;

// 共用色盤：罐內漂浮球與結果 tray 球皆用同組顏色，視覺一致
const BALL_COLORS = [
  'oklch(0.62 0.21 22)', // red
  'oklch(0.72 0.22 305)', // purple
  'oklch(0.82 0.14 82)', // gold
  'oklch(0.68 0.14 200)', // teal
  'oklch(0.78 0.18 145)', // green
] as const;
function ballColor(n: number): string {
  return BALL_COLORS[n % BALL_COLORS.length] ?? BALL_COLORS[0];
}

function randomDraw(poolSize: number, pickCount: number): number[] {
  const out: number[] = [];
  const used = new Set<number>();
  while (out.length < pickCount) {
    const n = 1 + Math.floor(Math.random() * poolSize);
    if (!used.has(n)) {
      used.add(n);
      out.push(n);
    }
  }
  return out;
}

export const LottoRoll = forwardRef<LottoRollRef, LottoRollProps>(function LottoRoll(
  {
    poolSize = 49,
    pickCount = 6,
    forcedNumbers,
    pickIntervalMs = 900,
    winChecker = defaultWinChecker,
    maxPlays = 2,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
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

  const [drawn, setDrawn] = useState<number[]>([]);
  const [tumbling, setTumbling] = useState(1);
  const liveRegionId = useId();
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  // 一次性 finalize guard + state 最新值，避免 timer 在受控 state 外翻時仍結算
  const finalizedRef = useRef(false);
  const stateRef = useLatestRef(state);

  const stopAll = useCallback(() => {
    if (shuffleRef.current) clearInterval(shuffleRef.current);
    for (const id of lockRefs.current) clearTimeout(id);
    shuffleRef.current = null;
    lockRefs.current = [];
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const finalize = useCallback(
    (target: readonly number[]) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      stopAll();
      setDrawn([...target]);
      const won = winChecker(target);
      setState(won ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(target, won);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.(target);
      } else {
        onLose?.(target);
      }
    },
    [remaining, winChecker, setState, setRemaining, onEnd, onWin, onLose, stopAll],
  );

  const draw = useCallback(
    (forced?: readonly number[]) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;

      const target: number[] =
        forced && forced.length === pickCount
          ? [...forced]
          : forcedNumbers && forcedNumbers.length === pickCount
            ? [...forcedNumbers]
            : randomDraw(poolSize, pickCount);

      setDrawn([]);
      finalizedRef.current = false;
      setState('playing');
      onStart?.();
      haptic(20);

      if (reducedMotion) {
        finalize(target);
        return;
      }

      stopAll();
      shuffleRef.current = setInterval(() => {
        setTumbling(1 + Math.floor(Math.random() * poolSize));
      }, 60);
      lockRefs.current = target.map((num, i) =>
        setTimeout(
          () => {
            if (stateRef.current !== 'playing') return;
            setDrawn((prev) => [...prev, num]);
            haptic(20);
            if (i === target.length - 1) {
              finalize(target);
            }
          },
          (i + 1) * pickIntervalMs,
        ),
      );
    },
    [
      state,
      remaining,
      pickCount,
      poolSize,
      forcedNumbers,
      pickIntervalMs,
      reducedMotion,
      setState,
      onStart,
      stopAll,
      finalize,
    ],
  );

  const reset = useCallback(() => {
    stopAll();
    finalizedRef.current = false;
    setDrawn([]);
    setState('idle');
  }, [setState, stopAll]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(drawn);
  }, [state, drawn, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      draw,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
      getNumbers: () => drawn,
    }),
    [draw, reset, claim, state, remaining, drawn],
  );

  const canDraw =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-lotto', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('lottoRoll.title')}
    >
      <div className="pk-lotto__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: {remaining}/{maxPlays}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-lotto__machine pk-plate pk-plate--gold">
        <div
          className={`pk-lotto__dome${state === 'playing' ? ' pk-lotto__dome--playing' : ''}`}
          aria-hidden="true"
        >
          <div className="pk-lotto__balls-area">
            {/* 罐內漂浮球：8 顆，隨機軌跡混亂運動（playing 時節奏加速）*/}
            {Array.from({ length: 8 }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: bg ball 位置固定
                key={i}
                className="pk-lotto__bg-ball"
                style={{
                  left: `${12 + ((i * 11) % 72)}%`,
                  bottom: `${6 + ((i * 17) % 26)}%`,
                  background: `radial-gradient(circle at 30% 30%, white, ${ballColor(i)} 72%)`,
                  animationDelay: `${-i * 0.19}s`,
                  animationDuration: `${2.2 + (i % 3) * 0.4}s`,
                }}
              />
            ))}
            {/* 當前正在決定的號碼球（playing 才有）；樣式同 bg-ball，只是帶號碼且浮在 chute 位置 */}
            {state === 'playing' ? (
              <div
                className="pk-lotto__ball-tumbling"
                key={tumbling}
                style={{
                  background: `radial-gradient(circle at 30% 30%, white, ${ballColor(tumbling)} 72%)`,
                }}
              >
                {tumbling}
              </div>
            ) : null}
          </div>
          <div className="pk-lotto__chute" />
        </div>
        <div className="pk-lotto__tray">
          <div className="pk-lotto__tray-label">{t('lottoRoll.drawLabel')}</div>
          <div className="pk-lotto__picks">
            {Array.from({ length: pickCount }, (_, i) => {
              const n = drawn[i];
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: slot 由 i 固定
                  key={i}
                  className={`pk-lotto__pick${n !== undefined ? ' pk-lotto__pick--filled' : ''}`}
                  style={
                    n !== undefined
                      ? {
                          background: `radial-gradient(circle at 30% 30%, white, ${ballColor(n)} 72%)`,
                        }
                      : undefined
                  }
                >
                  {n ?? '?'}
                </div>
              );
            })}
          </div>
        </div>
        <Button
          variant="primary"
          className="pk-lotto__btn"
          onClick={() => draw()}
          disabled={!canDraw}
          aria-describedby={liveRegionId}
        >
          {state === 'playing' ? t('lottoRoll.drawing') : t('action.start')}
        </Button>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-lotto__cta">
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
