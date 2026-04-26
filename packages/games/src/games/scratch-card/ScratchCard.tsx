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
import { isSSR } from '../../core/is-ssr';
import { StateBadge } from '../../core/state-badge';
import type { GameState } from '../../core/types';
import { useControlled } from '../../core/use-controlled';
import { useReducedMotion } from '../../core/use-reduced-motion';
import { useI18n } from '../../i18n/provider';
import type { ScratchCardProps, ScratchCardRef } from './types';
import './scratch-card.css';

const CARD_W = 320;
const CARD_H = 180;
const BRUSH = 44; // 刮痕線寬 px

export const ScratchCard = forwardRef<ScratchCardRef, ScratchCardProps>(function ScratchCard(
  {
    prize,
    revealThreshold = 0.55,
    scratchGain = 0.02,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onProgress,
    onReveal,
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

  const [progress, setProgress] = useState(0);
  const draggingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRegionId = useId();
  const finalizedRef = useRef(false);
  const repaintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkRafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (repaintTimerRef.current) clearTimeout(repaintTimerRef.current);
      if (checkRafRef.current !== null) cancelAnimationFrame(checkRafRef.current);
    },
    [],
  );

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isSSR()) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CARD_W * dpr;
    canvas.height = CARD_H * dpr;
    canvas.style.width = `${CARD_W}px`;
    canvas.style.height = `${CARD_H}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    // 金屬漸層底色
    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, 'oklch(0.55 0.02 85)');
    grad.addColorStop(0.3, 'oklch(0.72 0.03 85)');
    grad.addColorStop(0.55, 'oklch(0.48 0.02 85)');
    grad.addColorStop(0.85, 'oklch(0.65 0.03 85)');
    grad.addColorStop(1, 'oklch(0.42 0.02 85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    // 刷紋質感（隨機短線）
    for (let i = 0; i < 140; i++) {
      ctx.globalAlpha = 0.05 + Math.random() * 0.1;
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(Math.random() * CARD_W, Math.random() * CARD_H, 18, 1);
    }
    ctx.globalAlpha = 1;
    // Golden Ticket header
    ctx.fillStyle = 'oklch(0.35 0.12 60)';
    ctx.fillRect(0, 10, CARD_W, 28);
    ctx.fillStyle = 'oklch(0.92 0.06 82)';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('scratchCard.goldenTicket'), CARD_W / 2, 29);
    // 中央提示
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 22px Playfair Display, Georgia, serif';
    ctx.fillText(t('scratchCard.scratchHint'), CARD_W / 2, CARD_H / 2 + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(t('scratchCard.scratchSubHint'), CARD_W / 2, CARD_H / 2 + 28);
  }, [t]);

  useEffect(() => {
    paintCover();
  }, [paintCover]);

  const computeRevealed = useCallback((): number => {
    // finalize 後 cover 已被 destination-out 全清，省掉 ImageData scan
    if (finalizedRef.current) return 1;
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const W = canvas.width;
    const H = canvas.height;
    const step = 8 * (isSSR() ? 1 : window.devicePixelRatio || 1);
    try {
      const data = ctx.getImageData(0, 0, W, H).data;
      let cleared = 0;
      let total = 0;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const idx = (y * W + x) * 4 + 3;
          const alpha = data[idx] ?? 255;
          if (alpha < 30) cleared++;
          total++;
        }
      }
      return total > 0 ? cleared / total : 0;
    } catch {
      return 0;
    }
  }, []);

  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    // 全部清空 cover
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(0, 0, CARD_W, CARD_H);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    setState(prize.win ? 'won' : 'lost');
    onReveal?.(prize);
    haptic(prize.win ? [100, 50, 150] : 30);
  }, [prize, setState, onReveal]);

  const handleProgress = useCallback(
    (next: number) => {
      const clamped = Math.min(1, next);
      if (state === 'idle' && clamped > 0) {
        setState('playing');
        onStart?.();
      }
      setProgress(clamped);
      onProgress?.(clamped);
      // reducedMotion：任何正向刮動即立即 reveal，不用達到 threshold。
      const shouldFinalize = clamped >= revealThreshold || (reducedMotion && clamped > 0);
      if ((state === 'idle' || state === 'playing') && shouldFinalize) {
        finalize();
      }
    },
    [state, revealThreshold, reducedMotion, setState, onStart, onProgress, finalize],
  );

  // pointermove 在 ProMotion 螢幕上達 120Hz，每次都跑 getImageData + 像素掃描
  // 會在低階手機掉 frame；用 rAF 節流到一幀最多一次。
  const scheduleProgressCheck = useCallback(() => {
    if (checkRafRef.current !== null || finalizedRef.current) return;
    checkRafRef.current = requestAnimationFrame(() => {
      checkRafRef.current = null;
      if (finalizedRef.current) return;
      handleProgress(computeRevealed());
    });
  }, [handleProgress, computeRevealed]);

  // 外部 / test 呼叫：累加比例
  const scratch = useCallback(
    (delta?: number) => {
      if (state === 'claimed' || state === 'cooldown') return;
      handleProgress(progress + (delta ?? scratchGain));
    },
    [state, progress, scratchGain, handleProgress],
  );

  const revealAll = useCallback(() => {
    handleProgress(1);
  }, [handleProgress]);

  const reset = useCallback(() => {
    finalizedRef.current = false;
    setProgress(0);
    setState('idle');
    draggingRef.current = false;
    lastPtRef.current = null;
    if (repaintTimerRef.current) clearTimeout(repaintTimerRef.current);
    repaintTimerRef.current = setTimeout(() => {
      repaintTimerRef.current = null;
      paintCover();
    }, 0);
  }, [setState, paintCover]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(prize);
  }, [state, prize, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      scratch,
      revealAll,
      reset,
      claim,
      getState: () => state,
      getProgress: () => progress,
    }),
    [scratch, revealAll, reset, claim, state, progress],
  );

  // --------- Canvas drag-to-scratch ---------
  const drawStroke = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const last = lastPtRef.current;
    if (last) {
      ctx.moveTo(last.x, last.y);
    } else {
      ctx.moveTo(x, y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPtRef.current = { x, y };
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state === 'claimed' || state === 'cooldown' || state === 'won' || state === 'lost') return;
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    lastPtRef.current = null;
    const rect = canvas.getBoundingClientRect();
    drawStroke(e.clientX - rect.left, e.clientY - rect.top);
    scheduleProgressCheck();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    if (state === 'claimed' || state === 'cooldown' || state === 'won' || state === 'lost') return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    drawStroke(e.clientX - rect.left, e.clientY - rect.top);
    scheduleProgressCheck();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    lastPtRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const pct = Math.round(progress * 100);
  const isWin = prize.win;
  const announce =
    state === 'won'
      ? t('luckyWheel.announceWon', { prize: resolveLocalized(prize.label, lang) })
      : state === 'lost'
        ? t('luckyWheel.announceLost')
        : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-sc', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('scratchCard.title')}
    >
      <div className="pk-sc__meta">
        <StateBadge state={state} />
        <span>
          <b>{pct}%</b>
        </span>
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="pk-sc__card">
        {/* Underlying result */}
        <div className={`pk-sc__result${isWin ? ' pk-sc__result--win' : ' pk-sc__result--lose'}`}>
          <span className="pk-sc__corner pk-sc__corner--tl">◆</span>
          <span className="pk-sc__corner pk-sc__corner--tr">◆</span>
          <span className="pk-sc__corner pk-sc__corner--bl">◆</span>
          <span className="pk-sc__corner pk-sc__corner--br">◆</span>
          {isWin ? (
            <>
              <div className="pk-sc__ribbon">{t('scratchCard.winner')}</div>
              <div className="pk-sc__amount">{resolveLocalized(prize.label, lang)}</div>
              <div className="pk-sc__sub">{t('scratchCard.cashPrize')}</div>
            </>
          ) : (
            <>
              <div className="pk-sc__amount pk-sc__amount--miss">
                {resolveLocalized(prize.label, lang)}
              </div>
              <div className="pk-sc__sub">{t('scratchCard.tryAgainText')}</div>
            </>
          )}
        </div>
        {/* Scratchable cover canvas */}
        <canvas
          ref={canvasRef}
          className="pk-sc__canvas"
          aria-label={t('scratchCard.canvasLabel')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      {state === 'won' ? <Confetti /> : null}
      <div className="pk-sc__cta">
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')} · {resolveLocalized(prize.label, lang)}
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
