'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '../../core/button';
import { Confetti } from '../../core/confetti';
import { haptic } from '../../core/haptic';
import { resolveLocalized } from '../../core/i18n-utils';
import { isSSR } from '../../core/is-ssr';
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useGameScale } from '../../core/use-game-scale';
import { pickPrize } from '../../core/use-prize';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { LuckyWheelPrize, LuckyWheelProps, LuckyWheelRef } from './types';
import './lucky-wheel.css';

const BULB_COUNT = 16;
/** LuckyWheel 設計基準寬：board 340 + 周邊 padding，整體 max ≈ 372。useGameScale 用此計算窄容器 scale。 */
const DESIGN_WIDTH = 372;

export const LuckyWheel = forwardRef<LuckyWheelRef, LuckyWheelProps>(function LuckyWheel(
  {
    prizes,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    prizeIndex = -1,
    duration = 4600,
    easing = 'cubic-bezier(0.17, 0.8, 0.2, 1)',
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
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(DESIGN_WIDTH, {
    enabled: scalePolicy === 'auto',
  });

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

  const [angle, setAngle] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<{
    prize: LuckyWheelPrize;
    index: number;
  } | null>(null);
  const [bulbPhase, setBulbPhase] = useState(0);

  const liveRegionId = useId();
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sliceAngle = 360 / prizes.length;

  // bulb 位置在 mount 時算一次；每顆的 id 由極座標唯一決定（避免用 array index 當 key）
  const bulbLayout = useMemo(
    () =>
      Array.from({ length: BULB_COUNT }, (_, i) => {
        const angleRad = (i / BULB_COUNT) * Math.PI * 2 - Math.PI / 2;
        return {
          id: `bulb@${angleRad.toFixed(4)}`,
          idx: i,
          left: `calc(50% + ${Math.cos(angleRad) * 160}px - 5px)`,
          top: `calc(50% + ${Math.sin(angleRad) * 160}px - 5px)`,
        };
      }),
    [],
  );

  // 跑馬燈節奏：spin 時快、閒置時慢。SSR 環境不跑 timer
  useEffect(() => {
    if (isSSR()) return;
    const id = window.setInterval(
      () => setBulbPhase((p) => (p + 1) % 3),
      state === 'playing' ? 100 : 400,
    );
    return () => window.clearInterval(id);
  }, [state]);

  // 卸載時清掉未完成的 spin timer
  useEffect(
    () => () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    },
    [],
  );

  const spin = useCallback(
    (forcedIndex?: number) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;
      if (prizes.length === 0) return;

      const resolvedIndex =
        forcedIndex !== undefined && forcedIndex >= 0
          ? forcedIndex
          : prizeIndex >= 0
            ? prizeIndex
            : pickPrize(prizes);
      const safeIndex = Math.min(Math.max(resolvedIndex, 0), prizes.length - 1);
      const target = prizes[safeIndex];
      if (!target) return;

      const finalRotation = 360 * 6 + (360 - safeIndex * sliceAngle - sliceAngle / 2);
      setCurrentPrize(null);
      setState('playing');
      onStart?.();
      haptic(30);

      if (reducedMotion) {
        // 無動畫模式：直接跳到終態
        setAngle(finalRotation);
        setCurrentPrize({ prize: target, index: safeIndex });
        setState(target.win ? 'won' : 'lost');
        setRemaining(remaining - 1);
        onEnd?.(target, safeIndex);
        if (target.win) {
          haptic([80, 40, 120]);
          onWin?.(target);
        } else {
          onLose?.(target);
        }
        return;
      }

      setAngle((a) => a + finalRotation);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => {
        setCurrentPrize({ prize: target, index: safeIndex });
        setState(target.win ? 'won' : 'lost');
        setRemaining(remaining - 1);
        onEnd?.(target, safeIndex);
        if (target.win) {
          haptic([80, 40, 120]);
          onWin?.(target);
        } else {
          onLose?.(target);
        }
      }, duration);
    },
    [
      state,
      remaining,
      prizes,
      prizeIndex,
      sliceAngle,
      duration,
      reducedMotion,
      setState,
      setRemaining,
      onStart,
      onEnd,
      onWin,
      onLose,
    ],
  );

  const reset = useCallback(() => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    setCurrentPrize(null);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || !currentPrize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(currentPrize.prize);
  }, [state, currentPrize, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      spin,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
    }),
    [spin, reset, claim, state, remaining],
  );

  // 鍵盤捷徑：Enter / Space 觸發 spin（由中心按鈕 native 行為處理，這裡不額外綁）

  // 獎品顯示文字（a11y live region 用）
  const announce = useMemo(() => {
    if (state === 'won' && currentPrize) {
      return t('luckyWheel.announceWon', {
        prize: resolveLocalized(currentPrize.prize.label, lang),
      });
    }
    if (state === 'lost') return t('luckyWheel.announceLost');
    return '';
  }, [state, currentPrize, t, lang]);

  const isSpinning = state === 'playing';
  const showCooldown = state === 'cooldown';
  const canSpin = !isSpinning && state !== 'claimed' && !showCooldown && remaining > 0;

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-lw', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('luckyWheel.title')}
    >
      <div className="pk-lw__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: <b>{remaining}</b>/{maxPlays}
        </span>
      </div>

      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <div className="pk-lw__board">
        <div className="pk-lw__ring" aria-hidden="true" />

        <div className="pk-lw__bulbs" aria-hidden="true">
          {bulbLayout.map((b) => (
            <span
              key={b.id}
              className={`pk-lw__bulb${b.idx % 3 === bulbPhase ? '' : ' pk-lw__bulb--off'}`}
              style={{ left: b.left, top: b.top }}
            />
          ))}
        </div>

        <svg
          viewBox="-110 -110 220 220"
          width="300"
          height="300"
          className="pk-lw__svg"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isSpinning && !reducedMotion ? `transform ${duration}ms ${easing}` : 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="pk-lw-hub-grad" cx="50%" cy="40%">
              <stop offset="0%" stopColor="oklch(0.95 0.06 82)" />
              <stop offset="60%" stopColor="oklch(0.72 0.14 75)" />
              <stop offset="100%" stopColor="oklch(0.48 0.11 65)" />
            </radialGradient>
          </defs>
          {prizes.map((p, i) => {
            const a0 = ((i * sliceAngle - 90) * Math.PI) / 180;
            const a1 = (((i + 1) * sliceAngle - 90) * Math.PI) / 180;
            const r = 100;
            const x0 = Math.cos(a0) * r;
            const y0 = Math.sin(a0) * r;
            const x1 = Math.cos(a1) * r;
            const y1 = Math.sin(a1) * r;
            const midA = (a0 + a1) / 2;
            const tx = Math.cos(midA) * 62;
            const ty = Math.sin(midA) * 62;
            const ix = Math.cos(midA) * 82;
            const iy = Math.sin(midA) * 82;
            const labelText = resolveLocalized(p.label, lang);
            return (
              <g key={p.id ?? `${i}-${labelText}`}>
                <path
                  d={`M 0 0 L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`}
                  fill={p.color ?? 'var(--pk-bg-2)'}
                  stroke="oklch(0.18 0.03 285)"
                  strokeWidth="1.5"
                />
                <text
                  x={tx}
                  y={ty}
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--pk-font-display)"
                  transform={`rotate(${i * sliceAngle + sliceAngle / 2} ${tx} ${ty})`}
                >
                  {labelText}
                </text>
                {p.icon ? (
                  <text
                    x={ix}
                    y={iy}
                    fontSize="14"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${i * sliceAngle + sliceAngle / 2} ${ix} ${iy})`}
                  >
                    {p.icon}
                  </text>
                ) : null}
              </g>
            );
          })}
          <circle
            cx="0"
            cy="0"
            r="26"
            fill="url(#pk-lw-hub-grad)"
            stroke="oklch(0.48 0.11 65)"
            strokeWidth="1.5"
          />
        </svg>

        <div className="pk-lw__pointer" aria-hidden="true">
          <svg width="38" height="52" viewBox="0 0 38 52" aria-hidden="true">
            <defs>
              <linearGradient id="pk-lw-pt-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.72 0.22 25)" />
                <stop offset="1" stopColor="oklch(0.42 0.18 22)" />
              </linearGradient>
            </defs>
            <path
              d="M19 52 L3 12 Q19 -4 35 12 Z"
              fill="url(#pk-lw-pt-g)"
              stroke="oklch(0.82 0.14 82)"
              strokeWidth="2"
            />
            <circle cx="19" cy="14" r="3" fill="oklch(0.95 0.06 82)" />
          </svg>
        </div>

        <button
          type="button"
          className="pk-lw__hub"
          onClick={() => spin()}
          disabled={!canSpin}
          aria-label={t('luckyWheel.spin')}
          aria-describedby={liveRegionId}
        >
          <span aria-hidden="true">{isSpinning ? '···' : t('luckyWheel.spinLabel')}</span>
        </button>
      </div>

      {state === 'won' ? <Confetti /> : null}

      <div className="pk-lw__cta">
        {state === 'won' && currentPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(currentPrize.prize.label, lang)}
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
        {remaining <= 0 && state !== 'won' && state !== 'claimed' && !showCooldown ? (
          <Button variant="ghost" disabled>
            {t('common.todayDone')}
          </Button>
        ) : null}
        {showCooldown ? (
          <span className="pk-btn pk-btn--ghost" aria-live="polite">
            {t('state.cooldown')}
          </span>
        ) : null}
      </div>
    </section>
  );
});
