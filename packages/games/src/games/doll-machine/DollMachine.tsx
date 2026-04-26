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
import type { GameState, Prize } from '../../core/types';
import { useAnimationLoop } from '../../core/use-animation-loop';
import { useControlled } from '../../core/use-controlled';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { DollMachineProps, DollMachineRef } from './types';
import './doll-machine.css';

const PLUSH_ICONS = ['🧸', '🐼', '🐻', '🐰'];

export const DollMachine = forwardRef<DollMachineRef, DollMachineProps>(function DollMachine(
  {
    prizes,
    winRate = 0.3,
    forcedOutcome,
    forcedPrizeIndex,
    targetX = 70,
    tolerance = 12,
    sliderSpeed = 0.55,
    grabDurationMs = 1600,
    maxPlays = 3,
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
  const { t, lang } = useI18n();
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

  const [grabbedPrize, setGrabbedPrize] = useState<Prize | null>(null);
  // 本次 tryGrab 是否將贏（用於 CSS 控制娃娃是否跟著爪子上升）
  const [willWinThisRound, setWillWinThisRound] = useState(false);
  const liveRegionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // claw 擺動位置：ref 為資料來源，onFrame 直接寫 ref.style.left
  const posRef = useRef(15);
  const dirRef = useRef(1);
  const rigRef = useRef<HTMLDivElement>(null);
  const stateRef = useLatestRef(state);

  // playing 時鎖定 claw，其他 state 持續左右擺動
  useAnimationLoop({
    enabled: state !== 'playing',
    reducedMotion,
    onFrame: () => {
      let next = posRef.current + dirRef.current * sliderSpeed;
      if (next >= 85) {
        next = 85;
        dirRef.current = -1;
      } else if (next <= 15) {
        next = 15;
        dirRef.current = 1;
      }
      posRef.current = next;
      if (rigRef.current) rigRef.current.style.left = `${next}%`;
    },
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const tryGrab = useCallback(() => {
    if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
    if (remaining <= 0) return;
    if (prizes.length === 0) return;

    const currentPos = posRef.current;
    // 決定勝敗：優先 forcedOutcome，其次位置判定（若有 targetX），最後 winRate
    const willWin =
      forcedOutcome !== undefined
        ? forcedOutcome
        : Math.abs(currentPos - targetX) < tolerance || Math.random() < winRate;
    const prizeIdx =
      forcedPrizeIndex !== undefined && forcedPrizeIndex >= 0 && forcedPrizeIndex < prizes.length
        ? forcedPrizeIndex
        : Math.floor(Math.random() * prizes.length);
    const prize = willWin ? (prizes[prizeIdx] ?? null) : null;

    // 切 state='playing'，useAnimationLoop 會自動停止 slider rAF
    setWillWinThisRound(willWin);
    setState('playing');
    onStart?.();
    haptic(20);

    const finalize = () => {
      setGrabbedPrize(prize);
      setState(willWin ? 'won' : 'lost');
      setRemaining(remaining - 1);
      onEnd?.(prize, willWin);
      if (willWin && prize) {
        haptic([100, 50, 150]);
        onWin?.(prize);
      } else {
        onLose?.();
      }
    };

    if (reducedMotion) {
      finalize();
      return;
    }
    // timer callback 需在受控 state 外翻時早退，避免意外結算
    timerRef.current = setTimeout(() => {
      if (stateRef.current !== 'playing') return;
      finalize();
    }, grabDurationMs);
  }, [
    state,
    remaining,
    prizes,
    forcedOutcome,
    forcedPrizeIndex,
    targetX,
    tolerance,
    winRate,
    grabDurationMs,
    reducedMotion,
    setState,
    setRemaining,
    onStart,
    onEnd,
    onWin,
    onLose,
  ]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGrabbedPrize(null);
    setWillWinThisRound(false);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || !grabbedPrize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(grabbedPrize);
  }, [state, grabbedPrize, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      tryGrab,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
    }),
    [tryGrab, reset, claim, state, remaining],
  );

  const canGrab =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const announce =
    state === 'won' && grabbedPrize
      ? t('luckyWheel.announceWon', { prize: resolveLocalized(grabbedPrize.label, lang) })
      : state === 'lost'
        ? t('luckyWheel.announceLost')
        : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-doll', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('dollMachine.title')}
    >
      <div className="pk-doll__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: <b>{remaining}</b>/{maxPlays}
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-doll__machine pk-plate pk-plate--gold">
        <div className="pk-doll__top">
          <div className="pk-doll__neon">{t('dollMachine.brand')}</div>
        </div>
        <div className="pk-doll__chamber">
          <div className="pk-doll__rail" aria-hidden="true" />
          {/* target marker：目標娃娃下方微光 */}
          <div
            className="pk-doll__target-marker"
            style={{ left: `${targetX}%` }}
            aria-hidden="true"
          />
          <div
            ref={rigRef}
            className={`pk-doll__claw-rig${state === 'playing' ? ' pk-doll__claw-rig--grabbing' : ''}`}
            style={{ left: '15%' }}
            aria-hidden="true"
          >
            <div className="pk-doll__wire" />
            <div className={`pk-doll__claw${state === 'playing' ? ' pk-doll__claw--closed' : ''}`}>
              <span className="pk-doll__claw-l" />
              <span className="pk-doll__claw-r" />
            </div>
          </div>
          <div className="pk-doll__floor" aria-hidden="true">
            {PLUSH_ICONS.map((icon, i) => {
              // 最後一隻娃娃放在 targetX 位置（目標），其他平均分佈
              const isTarget = i === PLUSH_ICONS.length - 1;
              const x = isTarget ? targetX : 15 + i * 18;
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: plush 位置由 i 固定
                  key={i}
                  className={[
                    'pk-doll__plush',
                    isTarget ? 'pk-doll__plush--target' : '',
                    state === 'playing' && willWinThisRound && isTarget
                      ? 'pk-doll__plush--grabbing'
                      : '',
                    state === 'won' && isTarget ? 'pk-doll__plush--grabbed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: `${x}%` }}
                >
                  {icon}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-doll__cta">
        {canGrab ? (
          <Button variant="primary" onClick={tryGrab}>
            {t('action.start')}
          </Button>
        ) : null}
        {state === 'playing' ? (
          <Button variant="primary" disabled>
            …
          </Button>
        ) : null}
        {state === 'won' && grabbedPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(grabbedPrize.label, lang)}
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
