import type { BaseGameProps, GameState } from '../../core/types';

type LocalizedText = string | { 'zh-TW': string; en: string };

export interface QuizQuestion {
  id?: string;
  q: LocalizedText;
  opts: readonly LocalizedText[];
  /** 正解的 option index */
  ans: number;
}

export interface QuizProps extends BaseGameProps {
  questions: readonly QuizQuestion[];
  /** 每題倒數秒數，預設 10 */
  questionTimeSec?: number;
  /** 過關所需答對題數，預設 2 */
  passScore?: number;
  /** 揭示正解→進下題的延遲（ms），預設 1200 */
  feedbackMs?: number;
  onStart?: () => void;
  /** 每題作答時 fire；(index of question, selected option idx, isCorrect) */
  onAnswer?: (qIndex: number, selected: number, correct: boolean) => void;
  onEnd?: (score: number, total: number, won: boolean) => void;
  onWin?: (score: number) => void;
  onLose?: (score: number) => void;
  onClaim?: (score: number) => void;
}

export interface QuizRef {
  start: () => void;
  answer: (index: number) => void;
  reset: () => void;
  claim: () => void;
  getState: () => GameState;
  getScore: () => number;
  getQuestionIndex: () => number;
}
