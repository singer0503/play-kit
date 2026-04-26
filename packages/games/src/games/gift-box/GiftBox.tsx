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
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useLatestRef } from '../../core/use-latest-ref';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { GiftBoxProps, GiftBoxRef } from './types';
import './gift-box.css';

export const GiftBox = forwardRef<GiftBoxRef, GiftBoxProps>(function GiftBox(
  {
    boxes,
    openDelayMs = 700,
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

  const [picked, setPicked] = useState<number | null>(null);
  const liveRegionId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useLatestRef(state);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const pick = useCallback(
    (i: number) => {
      if (state !== 'idle') return;
      if (i < 0 || i >= boxes.length) return;
      const prize = boxes[i];
      if (!prize) return;
      setPicked(i);
      setState('playing');
      onStart?.();
      haptic(40);

      const finalize = () => {
        setState(prize.win ? 'won' : 'lost');
        onEnd?.(prize, i);
        if (prize.win) {
          haptic([100, 50, 150]);
          onWin?.(prize);
        } else {
          onLose?.(prize);
        }
      };

      if (reducedMotion) {
        finalize();
        return;
      }
      timerRef.current = setTimeout(() => {
        if (stateRef.current !== 'playing') return;
        finalize();
      }, openDelayMs);
    },
    [state, boxes, openDelayMs, reducedMotion, setState, onStart, onEnd, onWin, onLose],
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(null);
    setState('idle');
  }, [setState]);

  const claim = useCallback(() => {
    if (state !== 'won' || picked === null) return;
    const prize = boxes[picked];
    if (!prize) return;
    setState('claimed');
    haptic(40);
    onClaim?.(prize);
  }, [state, picked, boxes, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      pick,
      reset,
      claim,
      getState: () => state,
      getPicked: () => picked,
    }),
    [pick, reset, claim, state, picked],
  );

  const currentPrize = picked !== null ? boxes[picked] : null;
  const announce =
    state === 'won' && currentPrize
      ? t('luckyWheel.announceWon', { prize: resolveLocalized(currentPrize.label, lang) })
      : state === 'lost'
        ? t('luckyWheel.announceLost')
        : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-gb', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('giftBox.title')}
    >
      <div className="pk-gb__meta">
        <StateBadge state={state} />
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-gb__row">
        {boxes.map((b, i) => {
          const isPicked = picked === i;
          const isOpen = isPicked && (state === 'won' || state === 'lost' || state === 'claimed');
          const isDim = picked !== null && picked !== i;
          const cls = [
            'pk-gb__box',
            isPicked ? 'pk-gb__box--picked' : '',
            isOpen ? 'pk-gb__box--open' : '',
            isDim ? 'pk-gb__box--dim' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              type="button"
              key={b.id ?? `box-${i}`}
              className={cls}
              onClick={() => pick(i)}
              disabled={state !== 'idle'}
              aria-label={`Gift box ${i + 1}`}
              aria-describedby={liveRegionId}
            >
              <div className="pk-gb__body" aria-hidden="true" />
              <div className="pk-gb__ribbon-h" aria-hidden="true" />
              <div className="pk-gb__ribbon-v" aria-hidden="true" />
              <div className="pk-gb__lid" aria-hidden="true">
                <div className="pk-gb__bow" aria-hidden="true">
                  🎀
                </div>
              </div>
              <div className="pk-gb__reveal" aria-hidden="true">
                {isOpen ? (
                  <span className={`pk-gb__prize${b.win ? '' : ' pk-gb__prize--miss'}`}>
                    {resolveLocalized(b.label, lang)}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-gb__cta">
        {state === 'won' && currentPrize ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(currentPrize.label, lang)}
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
