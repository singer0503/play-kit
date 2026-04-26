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
import type { GuessGiftProps, GuessGiftRef } from './types';
import './guess-gift.css';

// slotOf[cupId] = 當前 cup 所在的 slot（0..cupCount-1）
export const GuessGift = forwardRef<GuessGiftRef, GuessGiftProps>(function GuessGift(
  {
    cupCount = 3,
    swapCount = 7,
    swapDurationMs = 650,
    revealMs = 900,
    ballCupIndex = -1,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onPick,
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

  const [slotOf, setSlotOf] = useState<number[]>(() =>
    Array.from({ length: cupCount }, (_, i) => i),
  );
  const [ballCup, setBallCup] = useState(0);
  const [showBall, setShowBall] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<number | null>(null);
  // 記錄當前一對正在交換的 cupId（arc-over / arc-under 動畫用）
  const [swapping, setSwapping] = useState<readonly [number, number] | null>(null);
  const liveRegionId = useId();
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  const SLOT_WIDTH = 96; // 80 cup + 16 gap
  const stopTimers = useCallback(() => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    swapTimerRef.current = null;
    revealTimerRef.current = null;
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  const start = useCallback(() => {
    if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
    if (remaining <= 0) return;
    const initialBallCup =
      ballCupIndex >= 0 && ballCupIndex < cupCount
        ? ballCupIndex
        : Math.floor(Math.random() * cupCount);
    setBallCup(initialBallCup);
    setSlotOf(Array.from({ length: cupCount }, (_, i) => i));
    setShowBall(true);
    setPickedSlot(null);
    setState('playing');
    onStart?.();
    haptic(20);

    if (reducedMotion) {
      setShowBall(false);
      setAnimating(false);
      return;
    }

    setAnimating(true);
    revealTimerRef.current = setTimeout(() => setShowBall(false), revealMs);

    // 用 ref 追 slotOf，避免在 setSlotOf updater 裡呼 setSwapping（Strict Mode double-fire）
    const slotOfRef = { current: Array.from({ length: cupCount }, (_, i) => i) };
    let swaps = 0;
    const doSwap = () => {
      // 受控 state 被外部翻回 idle/claimed 時立即中止 swap 遞迴
      if (stateRef.current !== 'playing') return;
      const cur = slotOfRef.current;
      const a = Math.floor(Math.random() * cupCount);
      let b = Math.floor(Math.random() * cupCount);
      while (b === a) b = Math.floor(Math.random() * cupCount);
      const cupA = cur.findIndex((s) => s === a);
      const cupB = cur.findIndex((s) => s === b);
      if (cupA !== -1 && cupB !== -1) {
        const next = [...cur];
        next[cupA] = b;
        next[cupB] = a;
        slotOfRef.current = next;
        setSlotOf(next);
        setSwapping([cupA, cupB]);
      }
      swaps += 1;
      if (swaps >= swapCount) {
        swapTimerRef.current = setTimeout(() => {
          if (stateRef.current !== 'playing') return;
          setSwapping(null);
          setAnimating(false);
        }, swapDurationMs);
        return;
      }
      swapTimerRef.current = setTimeout(doSwap, swapDurationMs);
    };
    swapTimerRef.current = setTimeout(doSwap, revealMs + 200);
  }, [
    state,
    remaining,
    cupCount,
    swapCount,
    swapDurationMs,
    revealMs,
    ballCupIndex,
    reducedMotion,
    setState,
    onStart,
  ]);

  const pick = useCallback(
    (slot: number) => {
      if (state !== 'playing' || animating || pickedSlot !== null) return;
      if (slot < 0 || slot >= cupCount) return;
      const cupId = slotOf.findIndex((s) => s === slot);
      const correct = cupId === ballCup;
      setPickedSlot(slot);
      setShowBall(true);
      onPick?.(slot, ballCup, correct);
      haptic(correct ? [100, 50, 150] : 30);

      revealTimerRef.current = setTimeout(() => {
        setState(correct ? 'won' : 'lost');
        setRemaining(remaining - 1);
        onEnd?.(correct);
        if (correct) onWin?.();
        else onLose?.();
      }, 500);
    },
    [
      state,
      animating,
      pickedSlot,
      cupCount,
      slotOf,
      ballCup,
      remaining,
      setState,
      setRemaining,
      onPick,
      onEnd,
      onWin,
      onLose,
    ],
  );

  const reset = useCallback(() => {
    stopTimers();
    setSlotOf(Array.from({ length: cupCount }, (_, i) => i));
    setShowBall(true);
    setAnimating(false);
    setPickedSlot(null);
    setState('idle');
  }, [cupCount, setState, stopTimers]);

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
      pick,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
      getBallCup: () => ballCup,
    }),
    [start, pick, reset, claim, state, remaining, ballCup],
  );

  const hint =
    state === 'idle'
      ? t('guessGift.watchBall')
      : state === 'playing' && animating
        ? t('guessGift.shuffling')
        : state === 'playing' && pickedSlot === null
          ? t('guessGift.whichCup')
          : state === 'won'
            ? t('common.congrats')
            : state === 'lost'
              ? t('common.soClose')
              : '';

  const pickedCupId = pickedSlot !== null ? slotOf.findIndex((s) => s === pickedSlot) : null;

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-gg', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('guessGift.title')}
    >
      <div className="pk-gg__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: <b>{remaining}</b>/{maxPlays}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {hint}
      </div>
      <div className="pk-gg__hint">{hint}</div>
      <div className="pk-gg__table">
        {Array.from({ length: cupCount }, (_, slot) => (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: slot 位置固定
            key={slot}
            className="pk-gg__slot"
            style={{ left: `${20 + slot * SLOT_WIDTH}px` }}
            onClick={() => pick(slot)}
            disabled={state !== 'playing' || animating || pickedSlot !== null}
            aria-label={t('guessGift.cupLabel', { index: slot + 1 })}
          />
        ))}
        {Array.from({ length: cupCount }, (_, cupId) => {
          const slot = slotOf[cupId] ?? cupId;
          const x = 20 + slot * SLOT_WIDTH;
          const lifted = pickedCupId === cupId;
          const hasBall = cupId === ballCup;
          const arcOver = swapping?.[0] === cupId;
          const arcUnder = swapping?.[1] === cupId;
          const wrapCls = [
            'pk-gg__cup-wrap',
            lifted ? 'pk-gg__cup-wrap--lifted' : '',
            arcOver ? 'pk-gg__cup-wrap--arc-over' : '',
            arcUnder ? 'pk-gg__cup-wrap--arc-under' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: cup 身分由 cupId 固定
              key={cupId}
              className={wrapCls}
              style={{ transform: `translateX(${x}px)` }}
              aria-hidden="true"
            >
              <div className="pk-gg__cup">
                <div className="pk-gg__cup-top" />
                <div className="pk-gg__cup-body" />
                <div className="pk-gg__cup-rim" />
              </div>
              {(showBall || lifted) && hasBall ? <span className="pk-gg__ball" /> : null}
            </div>
          );
        })}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-gg__cta">
        {state === 'idle' ? (
          <Button variant="primary" onClick={start}>
            {t('action.start')}
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
