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
import type { QuizProps, QuizQuestion, QuizRef } from './types';
import './quiz.css';

function localize(
  text: QuizQuestion['q'] | QuizQuestion['opts'][number],
  lang: 'zh-TW' | 'en',
): string {
  if (typeof text === 'string') return text;
  return text[lang] ?? text.en;
}

export const Quiz = forwardRef<QuizRef, QuizProps>(function Quiz(
  {
    questions,
    questionTimeSec = 10,
    passScore = 2,
    feedbackMs = 1200,
    state: stateProp,
    defaultState = 'idle',
    onStateChange,
    onStart,
    onAnswer,
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

  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionTimeSec);
  const liveRegionId = useId();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const stateRef = useLatestRef(state);

  const stopTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    tickRef.current = null;
    feedbackRef.current = null;
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  const endQuiz = useCallback(
    (finalScore: number) => {
      stopTimers();
      const won = finalScore >= passScore;
      setState(won ? 'won' : 'lost');
      onEnd?.(finalScore, questions.length, won);
      if (won) {
        haptic([100, 50, 150]);
        onWin?.(finalScore);
      } else {
        onLose?.(finalScore);
      }
    },
    [passScore, questions.length, setState, onEnd, onWin, onLose, stopTimers],
  );

  const advance = useCallback(
    (nextScore: number) => {
      const nextIndex = qi + 1;
      if (nextIndex >= questions.length) {
        endQuiz(nextScore);
        return;
      }
      setQi(nextIndex);
      setSelected(null);
      setTimeLeft(questionTimeSec);
    },
    [qi, questions.length, questionTimeSec, endQuiz],
  );

  // 倒數：selected 為 null 時啟動；純 tick，不在 updater 內呼叫副作用
  useEffect(() => {
    if (state !== 'playing' || selected !== null) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((x) => Math.max(0, x - 1));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state, selected]);

  // 時間歸零時，透過 effect 觸發「視為錯誤、進下題」；解耦於 setState updater 避免 Strict Mode double-fire
  useEffect(() => {
    if (state !== 'playing' || selected !== null || timeLeft !== 0) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setSelected(-1);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    // feedback delay 期間若外部已切終態，避免 advance 繼續誤跑
    feedbackRef.current = setTimeout(
      () => {
        if (stateRef.current !== 'playing') return;
        advance(scoreRef.current);
      },
      reducedMotion ? 0 : feedbackMs,
    );
  }, [state, selected, timeLeft, advance, feedbackMs, reducedMotion]);

  const start = useCallback(() => {
    if (state === 'playing') return;
    scoreRef.current = 0;
    setQi(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(questionTimeSec);
    setState('playing');
    onStart?.();
  }, [state, questionTimeSec, setState, onStart]);

  const answer = useCallback(
    (i: number) => {
      if (selected !== null || state !== 'playing') return;
      const current = questions[qi];
      if (!current) return;
      setSelected(i);
      const correct = i === current.ans;
      onAnswer?.(qi, i, correct);
      if (correct) {
        scoreRef.current += 1;
        setScore((s) => s + 1);
        haptic(40);
      } else {
        haptic(20);
      }
      feedbackRef.current = setTimeout(
        () => {
          if (stateRef.current !== 'playing') return;
          advance(scoreRef.current);
        },
        reducedMotion ? 0 : feedbackMs,
      );
    },
    [selected, state, qi, questions, feedbackMs, reducedMotion, advance, onAnswer],
  );

  const reset = useCallback(() => {
    stopTimers();
    scoreRef.current = 0;
    setQi(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(questionTimeSec);
    setState('idle');
  }, [questionTimeSec, setState, stopTimers]);

  const claim = useCallback(() => {
    if (state !== 'won') return;
    setState('claimed');
    haptic(40);
    onClaim?.(score);
  }, [state, score, setState, onClaim]);

  useImperativeHandle(
    ref,
    () => ({
      start,
      answer,
      reset,
      claim,
      getState: () => state,
      getScore: () => score,
      getQuestionIndex: () => qi,
    }),
    [start, answer, reset, claim, state, score, qi],
  );

  const currentQ = questions[qi];
  const pct = questionTimeSec > 0 ? (timeLeft / questionTimeSec) * 100 : 0;
  const announce =
    state === 'won' ? t('common.congrats') : state === 'lost' ? t('common.soClose') : '';

  return (
    <section
      {...rest}
      id={id}
      style={style}
      className={['pk-game', 'pk-quiz', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel ?? t('quiz.title')}
    >
      <div className="pk-quiz__meta">
        <StateBadge state={state} />
        {state === 'playing' ? (
          <span>
            {qi + 1}/{questions.length} · {timeLeft}s
          </span>
        ) : null}
      </div>
      <div id={liveRegionId} className="pk-sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      {state === 'idle' ? (
        <div className="pk-quiz__intro">
          <div className="pk-quiz__big">🧠</div>
          <div className="pk-quiz__title">{t('quiz.title')}</div>
          <div className="pk-quiz__sub">
            {t('quiz.intro', { pass: passScore, total: questions.length })}
          </div>
          <Button variant="primary" onClick={start}>
            {t('action.start')}
          </Button>
        </div>
      ) : null}

      {state === 'playing' && currentQ ? (
        <div className="pk-quiz__card">
          <div className="pk-quiz__progress" aria-hidden="true">
            <div className="pk-quiz__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="pk-quiz__q">{localize(currentQ.q, lang)}</div>
          <div className="pk-quiz__opts">
            {currentQ.opts.map((o, i) => {
              const isCorrect = selected !== null && i === currentQ.ans;
              const isWrong = selected === i && i !== currentQ.ans;
              const cls = [
                'pk-quiz__opt',
                isCorrect ? 'pk-quiz__opt--correct' : '',
                isWrong ? 'pk-quiz__opt--wrong' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  type="button"
                  // biome-ignore lint/suspicious/noArrayIndexKey: 選項位置由 i 固定
                  key={i}
                  className={cls}
                  onClick={() => answer(i)}
                  disabled={selected !== null}
                >
                  <span className="pk-quiz__key">{String.fromCharCode(65 + i)}</span>
                  <span>{localize(o, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {(state === 'won' || state === 'lost') && (
        <div className="pk-quiz__result">
          <div className="pk-quiz__big">{state === 'won' ? '🏆' : '💪'}</div>
          <div className="pk-quiz__title">
            {state === 'won' ? t('common.congrats') : t('common.soClose')}
          </div>
          <div className="pk-quiz__sub">
            {score}/{questions.length}
          </div>
        </div>
      )}

      {state === 'won' ? <Confetti /> : null}

      <div className="pk-quiz__cta">
        {state === 'won' ? (
          <Button variant="primary" onClick={claim}>
            {t('action.claim')}
          </Button>
        ) : null}
        {state === 'lost' ? (
          <Button variant="ghost" onClick={start}>
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
