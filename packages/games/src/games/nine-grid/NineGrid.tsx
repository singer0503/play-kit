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
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useGameScale } from '../../core/use-game-scale';
import { useLatestRef } from '../../core/use-latest-ref';
import { pickPrize } from '../../core/use-prize';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n, useScalePolicy } from '../../i18n/provider';
import type { NineGridProps, NineGridRef } from './types';
import './nine-grid.css';

// 順時針：上排左→中→右、中排右、下排右→中→左、中排左
// 對應 3×3 grid index（行優先，中間 idx=4）
const OUTER_POSITION_TO_GRID = [0, 1, 2, 5, 8, 7, 6, 3] as const;

export const NineGrid = forwardRef<NineGridRef, NineGridProps>(function NineGrid(
  {
    cells,
    maxPlays = 3,
    defaultRemaining,
    remaining: remainingProp,
    onRemainingChange,
    prizeIndex = -1,
    loops = 3,
    stepInterval = 80,
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
  const scalePolicy = useScalePolicy();
  const scaleRef = useGameScale<HTMLElement>(352, { enabled: scalePolicy === 'auto' });
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

  const [activeIdx, setActiveIdx] = useState(-1);
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const liveRegionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  // 清理進行中的 animation timer
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const start = useCallback(
    (forcedOuterPos?: number) => {
      if (state === 'playing' || state === 'claimed' || state === 'cooldown') return;
      if (remaining <= 0) return;
      if (cells.length !== 8) return;

      const resolvedPos =
        forcedOuterPos !== undefined && forcedOuterPos >= 0
          ? forcedOuterPos
          : prizeIndex >= 0
            ? prizeIndex
            : pickPrize(cells);
      const safePos = Math.min(Math.max(resolvedPos, 0), 7);
      const target = cells[safePos];
      if (!target) return;

      setWinIdx(null);
      setState('playing');
      onStart?.();
      haptic(20);

      if (reducedMotion) {
        const gridIdx = OUTER_POSITION_TO_GRID[safePos] ?? -1;
        setActiveIdx(gridIdx);
        setWinIdx(gridIdx);
        setState(target.win ? 'won' : 'lost');
        setRemaining(remaining - 1);
        onEnd?.(target, safePos);
        if (target.win) {
          haptic([60, 40, 80]);
          onWin?.(target);
        } else {
          onLose?.(target);
        }
        return;
      }

      let step = 0;
      const totalSteps = 8 * loops + safePos;
      let delay = stepInterval;
      const run = () => {
        const pos = step % 8;
        setActiveIdx(OUTER_POSITION_TO_GRID[pos] ?? -1);
        step++;
        if (step > totalSteps) {
          const gridIdx = OUTER_POSITION_TO_GRID[safePos] ?? -1;
          setWinIdx(gridIdx);
          setState(target.win ? 'won' : 'lost');
          setRemaining(remaining - 1);
          onEnd?.(target, safePos);
          if (target.win) {
            haptic([60, 40, 80]);
            onWin?.(target);
          } else {
            onLose?.(target);
          }
          return;
        }
        // 末段減速
        if (step > totalSteps - 8) delay += 45;
        else if (step > totalSteps - 16) delay += 15;
        timerRef.current = setTimeout(() => {
          if (stateRef.current !== 'playing') return;
          run();
        }, delay);
      };
      run();
    },
    [
      state,
      remaining,
      cells,
      prizeIndex,
      loops,
      stepInterval,
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
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIdx(-1);
    setWinIdx(null);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || winIdx === null) return;
    const pos = OUTER_POSITION_TO_GRID.indexOf(winIdx as (typeof OUTER_POSITION_TO_GRID)[number]);
    const prize = cells[pos];
    if (!prize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(prize);
  }, [state, winIdx, cells, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      reset,
      claim,
      getState: () => state,
      getRemaining: () => remaining,
    }),
    [start, reset, claim, state, remaining],
  );

  // 勝利宣告
  const announce = useMemo(() => {
    if (state === 'won' && winIdx !== null) {
      const pos = OUTER_POSITION_TO_GRID.indexOf(winIdx as (typeof OUTER_POSITION_TO_GRID)[number]);
      const prize = cells[pos];
      if (prize) return t('luckyWheel.announceWon', { prize: resolveLocalized(prize.label, lang) });
    }
    if (state === 'lost') return t('luckyWheel.announceLost');
    return '';
  }, [state, winIdx, cells, t, lang]);

  const canStart =
    state !== 'playing' && state !== 'claimed' && state !== 'cooldown' && remaining > 0;
  const currentPrize =
    winIdx !== null
      ? cells[OUTER_POSITION_TO_GRID.indexOf(winIdx as (typeof OUTER_POSITION_TO_GRID)[number])]
      : null;

  return (
    <section
      ref={scaleRef}
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-ng', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('nineGrid.title')}
    >
      <div className="pk-ng__meta">
        <StateBadge state={state} />
        <span>
          {t('common.remaining')}: <b>{remaining}</b>/{maxPlays}
        </span>
      </div>

      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <div className="pk-ng__grid">
        {Array.from({ length: 9 }, (_, gridIdx) => {
          if (gridIdx === 4) {
            return (
              <button
                key="center"
                type="button"
                className="pk-ng__center"
                onClick={() => start()}
                disabled={!canStart}
                aria-label={t('action.start')}
                aria-describedby={liveRegionId}
              >
                {state === 'idle'
                  ? t('action.start')
                  : state === 'playing'
                    ? '…'
                    : state === 'won'
                      ? '✓'
                      : state === 'lost'
                        ? '×'
                        : state === 'claimed'
                          ? '✓'
                          : '⌛'}
              </button>
            );
          }
          const pos = OUTER_POSITION_TO_GRID.indexOf(
            gridIdx as (typeof OUTER_POSITION_TO_GRID)[number],
          );
          const cell = cells[pos];
          if (!cell) {
            // 補位空格：gridIdx 為 3×3 中固定位置索引，為唯一值
            // biome-ignore lint/suspicious/noArrayIndexKey: gridIdx 為 3×3 固定位置索引
            return <div key={gridIdx} className="pk-ng__cell" />;
          }
          const isActive = activeIdx === gridIdx;
          const isWin = winIdx === gridIdx && state !== 'playing';
          const cls = [
            'pk-ng__cell',
            isActive ? 'pk-ng__cell--active' : '',
            isWin ? (cell.win ? 'pk-ng__cell--win' : 'pk-ng__cell--lose') : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={cell.id ?? `cell-${pos}`} className={cls}>
              {cell.icon ? <div className="pk-ng__cell-icon">{cell.icon}</div> : null}
              <div className="pk-ng__cell-label">{resolveLocalized(cell.label, lang)}</div>
            </div>
          );
        })}
      </div>

      {state === 'won' ? <Confetti /> : null}

      <div className="pk-ng__cta">
        {state === 'won' && currentPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(currentPrize.label, lang)}
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
