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
import { useGameScale } from '../../core/use-game-scale';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { SlotMachineProps, SlotMachineRef } from './types';
import './slot-machine.css';

const DEFAULT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
const DEFAULT_STOP_TIMES = [1100, 1700, 2400];

// Strip 視覺參數：每個 symbol 的高度、重複次數、捲動速度、落定過渡時間
const SYMBOL_H = 72; // px
const REPEAT_COUNT = 6;
const SPIN_PX_PER_MS = 0.9;
const LAND_ANCHOR = 3; // 落定時位於 strip 第 N 輪，避免邊界
const LAND_MS = 600;

function allSame(arr: readonly number[]): boolean {
  if (arr.length === 0) return false;
  return arr.every((v) => v === arr[0]);
}

export const SlotMachine = forwardRef<SlotMachineRef, SlotMachineProps>(function SlotMachine(
  {
    symbols = DEFAULT_SYMBOLS,
    reelCount = 3,
    winRate = 0.28,
    forcedSymbols,
    stopTimes = DEFAULT_STOP_TIMES,
    maxPlays = 5,
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
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(400, { enabled: scalePolicy === 'auto' });
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

  const [reels, setReels] = useState<number[]>(() => Array(reelCount).fill(0));
  // 每個 reel 是否還在 spinning（false 時交給 CSS transition 收尾到最終位置）
  const [spinningFlags, setSpinningFlags] = useState<boolean[]>(() => Array(reelCount).fill(false));
  const liveRegionId = useId();

  // 每條 strip 的 DOM ref + 當前 translateY offset（onFrame 直接寫 ref.style.transform）
  const stripsRef = useRef<(HTMLDivElement | null)[]>([]);
  const offsetsRef = useRef<number[]>(Array(reelCount).fill(0));
  const stopTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stateRef = useLatestRef(state);

  const cycleHeight = symbols.length * SYMBOL_H;

  const stopAllTimers = useCallback(() => {
    for (const id of stopTimersRef.current) clearTimeout(id);
    stopTimersRef.current = [];
  }, []);

  useEffect(() => () => stopAllTimers(), [stopAllTimers]);

  // rAF 由 useAnimationLoop 代為處理 cleanup / SSR guard；symbols 連續由下往上滑過 viewport
  useAnimationLoop({
    enabled: spinningFlags.some(Boolean),
    reducedMotion,
    onFrame: (dt) => {
      for (let i = 0; i < spinningFlags.length; i++) {
        if (!spinningFlags[i]) continue;
        let next = (offsetsRef.current[i] ?? 0) - dt * SPIN_PX_PER_MS;
        // 把 offset 限制在一個 cycle 內，避免數值無限成長
        while (next < -cycleHeight) next += cycleHeight;
        offsetsRef.current[i] = next;
        const el = stripsRef.current[i];
        if (el) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${next}px)`;
        }
      }
    },
  });

  const finalize = useCallback(
    (targetReels: readonly number[]) => {
      setReels([...targetReels]);
      setSpinningFlags(Array(reelCount).fill(false));
      const won = allSame(targetReels);
      setState(won ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(targetReels, won);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.(targetReels);
      } else {
        onLose?.(targetReels);
      }
    },
    [reelCount, remaining, setState, setRemaining, onEnd, onWin, onLose],
  );

  const spin = useCallback(
    (forced?: readonly number[]) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;

      // 決定最終 reels
      const target: number[] = (() => {
        if (forced && forced.length === reelCount) return [...forced];
        if (forcedSymbols && forcedSymbols.length === reelCount) return [...forcedSymbols];
        const roll = Array.from({ length: reelCount }, () =>
          Math.floor(Math.random() * symbols.length),
        );
        if (Math.random() < winRate) {
          const s = Math.floor(Math.random() * symbols.length);
          return Array(reelCount).fill(s);
        }
        return roll;
      })();

      stopAllTimers();
      offsetsRef.current = Array(reelCount).fill(0);
      // 清掉 strip 上一次落定的 inline transform / transition，讓下一波 rAF 能接手
      for (const el of stripsRef.current) {
        if (el) {
          el.style.transition = 'none';
          el.style.transform = 'translateY(0px)';
        }
      }

      setState('playing');
      setSpinningFlags(Array(reelCount).fill(true));
      onStart?.();
      haptic(20);

      if (reducedMotion) {
        finalize(target);
        return;
      }

      // 各 reel 依 stopTimes[i] 停下；從當前 offset 順勢多捲 N 圈再停到目標 symbol。
      // finalY 必為 SYMBOL_H 的整數倍（snap），symbol 才會正好完整置中於 viewport。
      stopTimersRef.current = target.map((finalSym, i) =>
        setTimeout(() => {
          if (stateRef.current !== 'playing') return;
          setSpinningFlags((prev) => prev.map((s, idx) => (idx === i ? false : s)));
          const el = stripsRef.current[i];
          if (el) {
            const currentOffset = offsetsRef.current[i] ?? 0;
            // 當前「往下已經走過幾個 symbol」（浮點）
            const advanced = -currentOffset / SYMBOL_H;
            // 至少再前進多少 symbol 才讓 transition 有減速感
            const minExtra = LAND_ANCHOR * symbols.length;
            const minTotal = Math.ceil(advanced) + minExtra;
            // 找 ≥ minTotal 的最小整數 k 使 k mod symbols.length === finalSym
            const k =
              minTotal +
              ((finalSym - (minTotal % symbols.length) + symbols.length) % symbols.length);
            const finalY = -k * SYMBOL_H; // 整數倍 × 72px，保證對齊 viewport
            el.style.transition = `transform ${LAND_MS}ms cubic-bezier(0.15, 0.8, 0.3, 1)`;
            el.style.transform = `translateY(${finalY}px)`;
            offsetsRef.current[i] = finalY;
          }
          // 最後一個 reel 停下立刻 finalize（state=won/lost），CSS transition 在畫面繼續跑
          if (i === reelCount - 1) finalize(target);
        }, stopTimes[i] ?? 2400),
      );
    },
    [
      state,
      remaining,
      reelCount,
      symbols.length,
      forcedSymbols,
      winRate,
      reducedMotion,
      stopTimes,
      setState,
      onStart,
      stopAllTimers,
      finalize,
    ],
  );

  const reset = useCallback(() => {
    stopAllTimers();
    setSpinningFlags(Array(reelCount).fill(false));
    for (const el of stripsRef.current) {
      if (el) {
        el.style.transition = 'none';
        el.style.transform = 'translateY(0px)';
      }
    }
    setState('idle');
  }, [reelCount, setState, stopAllTimers]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(reels);
  }, [state, reels, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      spin,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
      getReels: () => reels,
    }),
    [spin, reset, claim, state, remaining, reels],
  );

  const canSpin =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  // Strip 裡放 REPEAT_COUNT 輪 symbols，確保 rAF 捲動時看起來是無限的
  const stripSymbols = Array.from({ length: REPEAT_COUNT * symbols.length }, (_, k) => ({
    key: k,
    glyph: symbols[k % symbols.length] ?? '?',
  }));

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-slot', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('slotMachine.title')}
    >
      <div className="pk-slot__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: {remaining}/{maxPlays}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-slot__machine pk-plate pk-plate--gold">
        <div className="pk-slot__topsign">
          <div className="pk-slot__topsign-bulbs" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: bulb 為固定裝飾元素，index 即是其唯一位置
                key={i}
                className={`pk-bulb${i % 2 === 0 ? '' : ' pk-bulb--off'}`}
                style={{ position: 'relative', left: 0, top: 0 }}
              />
            ))}
          </div>
          <div className="pk-slot__brand">{t('slotMachine.brand777')}</div>
        </div>
        <div className="pk-slot__screen">
          {reels.map((r, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: reel 位置由 i 固定識別（同組 symbols 中的第 i 輪）
              key={i}
              className="pk-slot__reel"
              role="img"
              aria-label={t('slotMachine.reelAria', { index: i + 1, symbol: symbols[r] ?? '?' })}
            >
              <div
                ref={(el) => {
                  stripsRef.current[i] = el;
                }}
                className="pk-slot__strip"
              >
                {stripSymbols.map((s) => (
                  <div key={s.key} className="pk-slot__sym">
                    {s.glyph}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pk-slot__payline" aria-hidden="true" />
        </div>
        <div className="pk-slot__base">
          <div className="pk-slot__coinslot" aria-hidden="true">
            <span>{t('slotMachine.coin')}</span>
          </div>
          <Button
            variant="primary"
            className="pk-slot__spin-btn"
            onClick={() => spin()}
            disabled={!canSpin}
            aria-describedby={liveRegionId}
          >
            {state === 'playing' ? '…' : t('action.spin')}
          </Button>
          <button
            type="button"
            className="pk-slot__lever"
            onClick={() => spin()}
            disabled={!canSpin}
            aria-label={t('slotMachine.pullLever')}
          >
            <span className="pk-slot__lever-ball" />
            <span className="pk-slot__lever-rod" />
            <span className="pk-slot__lever-base" />
          </button>
        </div>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-slot__cta">
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
