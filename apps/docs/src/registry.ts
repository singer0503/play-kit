import {
  DailyCheckin,
  DollMachine,
  FlipMatch,
  GiftBox,
  GiftRain,
  GuessGift,
  LottoRoll,
  LuckyWheel,
  Marquee,
  NineGrid,
  Quiz,
  RingToss,
  ScratchCard,
  Shake,
  ShakeDice,
  SlotMachine,
  SmashEgg,
} from '@play-kit/games';
import type { LuckyWheelProps, MarqueePrize, NineGridProps, QuizQuestion } from '@play-kit/games';
import { type ComponentType, type ReactElement, createElement } from 'react';
import type { ApiEventRow, ApiMethodRow, ApiPropRow } from './docs-ui/ApiTable';

// ============================================================
// `?raw` imports — Code tab 顯示的就是真正的 source，徹底消除 drift
// ============================================================
import dailyCheckinSource from '@play-kit/games/games/daily-checkin/DailyCheckin.tsx?raw';
import dailyCheckinTypes from '@play-kit/games/games/daily-checkin/types.ts?raw';
import dollMachineSource from '@play-kit/games/games/doll-machine/DollMachine.tsx?raw';
import dollMachineTypes from '@play-kit/games/games/doll-machine/types.ts?raw';
import flipMatchSource from '@play-kit/games/games/flip-match/FlipMatch.tsx?raw';
import flipMatchTypes from '@play-kit/games/games/flip-match/types.ts?raw';
import giftBoxSource from '@play-kit/games/games/gift-box/GiftBox.tsx?raw';
import giftBoxTypes from '@play-kit/games/games/gift-box/types.ts?raw';
import giftRainSource from '@play-kit/games/games/gift-rain/GiftRain.tsx?raw';
import giftRainTypes from '@play-kit/games/games/gift-rain/types.ts?raw';
import guessGiftSource from '@play-kit/games/games/guess-gift/GuessGift.tsx?raw';
import guessGiftTypes from '@play-kit/games/games/guess-gift/types.ts?raw';
import lottoRollSource from '@play-kit/games/games/lotto-roll/LottoRoll.tsx?raw';
import lottoRollTypes from '@play-kit/games/games/lotto-roll/types.ts?raw';
import luckyWheelSource from '@play-kit/games/games/lucky-wheel/LuckyWheel.tsx?raw';
import luckyWheelTypes from '@play-kit/games/games/lucky-wheel/types.ts?raw';
import marqueeSource from '@play-kit/games/games/marquee/Marquee.tsx?raw';
import marqueeTypes from '@play-kit/games/games/marquee/types.ts?raw';
import nineGridSource from '@play-kit/games/games/nine-grid/NineGrid.tsx?raw';
import nineGridTypes from '@play-kit/games/games/nine-grid/types.ts?raw';
import quizSource from '@play-kit/games/games/quiz/Quiz.tsx?raw';
import quizTypes from '@play-kit/games/games/quiz/types.ts?raw';
import ringTossSource from '@play-kit/games/games/ring-toss/RingToss.tsx?raw';
import ringTossTypes from '@play-kit/games/games/ring-toss/types.ts?raw';
import scratchCardSource from '@play-kit/games/games/scratch-card/ScratchCard.tsx?raw';
import scratchCardTypes from '@play-kit/games/games/scratch-card/types.ts?raw';
import shakeDiceSource from '@play-kit/games/games/shake-dice/ShakeDice.tsx?raw';
import shakeDiceTypes from '@play-kit/games/games/shake-dice/types.ts?raw';
import shakeSource from '@play-kit/games/games/shake/Shake.tsx?raw';
import shakeTypes from '@play-kit/games/games/shake/types.ts?raw';
import slotMachineSource from '@play-kit/games/games/slot-machine/SlotMachine.tsx?raw';
import slotMachineTypes from '@play-kit/games/games/slot-machine/types.ts?raw';
import smashEggSource from '@play-kit/games/games/smash-egg/SmashEgg.tsx?raw';
import smashEggTypes from '@play-kit/games/games/smash-egg/types.ts?raw';

export type GameCategory = 'classic' | 'skill' | 'loyalty';

export interface GameMeta {
  id: string;
  category: GameCategory;
  icon: string;
  accent: string;
  title: { 'zh-TW': string; en: string };
  shortDesc: { 'zh-TW': string; en: string };
  longDesc: { 'zh-TW': string; en: string };
  /** 以指定 override 渲染 demo；不傳 override 時用 defaultProps */
  render: (overrides?: Record<string, unknown>) => ReactElement;
  /** defaultProps 複本（PropsPlayground knob 初始值用） */
  seedProps: Record<string, unknown>;
  source: {
    component: string;
    types: string;
  };
  intro: { 'zh-TW': string; en: string };
  install: string;
  basicUsage: string;
  knobs?: ReadonlyArray<{
    prop: string;
    type: 'number' | 'boolean' | 'string';
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    default?: unknown;
  }>;
  api: {
    props: ReadonlyArray<ApiPropRow>;
    events: ReadonlyArray<ApiEventRow>;
    methods: ReadonlyArray<ApiMethodRow>;
    types: string;
  };
}

/**
 * 工廠：把 `Component` + `defaultProps` 收進 closure，對外暴露 typed `render()`。
 * 好處：registry 可持有多個 Props 型別不同的 game，卻不需 `ComponentType<any>`。
 */
export function defineGame<TProps extends object>(
  input: Omit<GameMeta, 'render' | 'seedProps'> & {
    Component: ComponentType<TProps>;
    defaultProps: TProps;
  },
): GameMeta {
  const { Component, defaultProps, ...rest } = input;
  return {
    ...rest,
    seedProps: { ...defaultProps } as Record<string, unknown>,
    render: (overrides) =>
      createElement(Component, { ...defaultProps, ...(overrides as Partial<TProps>) }),
  };
}

// ============================================================
// 共用 props：所有 game 皆有（extends BaseGameProps）
// ============================================================
const BASE_PROPS: ReadonlyArray<ApiPropRow> = [
  {
    name: 'state',
    type: 'GameState',
    default: '—',
    desc: { 'zh-TW': '受控狀態', en: 'Controlled state' },
  },
  {
    name: 'defaultState',
    type: 'GameState',
    default: "'idle'",
    desc: { 'zh-TW': '非受控初始 state', en: 'Uncontrolled initial state' },
  },
  {
    name: 'onStateChange',
    type: '(s: GameState) => void',
    default: '—',
    desc: { 'zh-TW': 'state 改變', en: 'State changes' },
  },
  {
    name: 'className',
    type: 'string',
    default: '—',
    desc: { 'zh-TW': '額外 className', en: 'Extra className' },
  },
  {
    name: 'aria-label',
    type: 'string',
    default: 'i18n 預設',
    desc: { 'zh-TW': '覆寫 aria-label', en: 'Override aria-label' },
  },
];

// 不同 game 有不同 maxPlays 預設（大多數=3、lotto-roll=2、slot-machine=5）。
// 把 defaultRemaining / remaining / onRemainingChange 三個不變的 row 抽成共用 const，
// 每個 REMAINING_PROPS_N 只負責自己的 maxPlays 預設值。
// verify-docs 已支援 nested spread 遞迴解析（Identifier→ArrayLiteral 可多層）。
const REMAINING_SHARED: ReadonlyArray<ApiPropRow> = [
  {
    name: 'defaultRemaining',
    type: 'number',
    default: 'maxPlays',
    desc: { 'zh-TW': '非受控初始剩餘次數', en: 'Uncontrolled initial remaining' },
  },
  {
    name: 'remaining',
    type: 'number',
    default: '—',
    desc: { 'zh-TW': '受控剩餘次數', en: 'Controlled remaining' },
  },
  {
    name: 'onRemainingChange',
    type: '(n: number) => void',
    default: '—',
    desc: { 'zh-TW': 'remaining 改變', en: 'Remaining changes' },
  },
];
const REMAINING_PROPS: ReadonlyArray<ApiPropRow> = [
  {
    name: 'maxPlays',
    type: 'number',
    default: '3',
    desc: { 'zh-TW': '每場最大遊玩次數', en: 'Max plays per session' },
  },
  ...REMAINING_SHARED,
];
const REMAINING_PROPS_2: ReadonlyArray<ApiPropRow> = [
  {
    name: 'maxPlays',
    type: 'number',
    default: '2',
    desc: { 'zh-TW': '每場最大遊玩次數', en: 'Max plays per session' },
  },
  ...REMAINING_SHARED,
];
const REMAINING_PROPS_5: ReadonlyArray<ApiPropRow> = [
  {
    name: 'maxPlays',
    type: 'number',
    default: '5',
    desc: { 'zh-TW': '每場最大遊玩次數', en: 'Max plays per session' },
  },
  ...REMAINING_SHARED,
];

// ============================================================
// 示範資料
// ============================================================
const luckyWheelDemoPrizes: LuckyWheelProps['prizes'] = [
  {
    id: 'p1',
    label: { 'zh-TW': '$100', en: '$100' },
    win: true,
    weight: 1,
    color: 'oklch(0.62 0.21 22)',
    icon: '💰',
  },
  {
    id: 'p2',
    label: { 'zh-TW': '謝謝', en: 'Miss' },
    win: false,
    weight: 4,
    color: 'oklch(0.28 0.04 290)',
  },
  {
    id: 'p3',
    label: { 'zh-TW': '$20', en: '$20' },
    win: true,
    weight: 2,
    color: 'oklch(0.58 0.22 305)',
    icon: '💎',
  },
  {
    id: 'p4',
    label: { 'zh-TW': '謝謝', en: 'Miss' },
    win: false,
    weight: 4,
    color: 'oklch(0.28 0.04 290)',
  },
  {
    id: 'p5',
    label: { 'zh-TW': '$5', en: '$5' },
    win: true,
    weight: 3,
    color: 'oklch(0.68 0.14 200)',
    icon: '🪙',
  },
  {
    id: 'p6',
    label: { 'zh-TW': '謝謝', en: 'Miss' },
    win: false,
    weight: 4,
    color: 'oklch(0.28 0.04 290)',
  },
  {
    id: 'p7',
    label: { 'zh-TW': 'JACKPOT', en: 'JACKPOT' },
    win: true,
    weight: 1,
    color: 'oklch(0.82 0.14 82)',
    icon: '👑',
  },
  {
    id: 'p8',
    label: { 'zh-TW': '謝謝', en: 'Miss' },
    win: false,
    weight: 4,
    color: 'oklch(0.28 0.04 290)',
  },
];

const nineGridDemoCells: NineGridProps['cells'] = [
  { id: 'c1', label: { 'zh-TW': '$88', en: '$88' }, win: true, weight: 1, icon: '💎' },
  { id: 'c2', label: { 'zh-TW': '$10', en: '$10' }, win: true, weight: 2, icon: '🎁' },
  { id: 'c3', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎫' },
  { id: 'c4', label: { 'zh-TW': '$5', en: '$5' }, win: true, weight: 3, icon: '⭐' },
  { id: 'c5', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎟️' },
  { id: 'c6', label: { 'zh-TW': '$200', en: '$200' }, win: true, weight: 1, icon: '🏆' },
  { id: 'c7', label: { 'zh-TW': '$2', en: '$2' }, win: true, weight: 3, icon: '💰' },
  { id: 'c8', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎰' },
];

const marqueeDemoPrizes: readonly MarqueePrize[] = [
  { id: 'm1', label: { 'zh-TW': '$100', en: '$100' }, win: true, weight: 1, icon: '💰' },
  { id: 'm2', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎟️' },
  { id: 'm3', label: { 'zh-TW': '$50', en: '$50' }, win: true, weight: 2, icon: '💎' },
  { id: 'm4', label: { 'zh-TW': '福袋', en: 'Pack' }, win: true, weight: 2, icon: '🎁' },
  { id: 'm5', label: { 'zh-TW': '$5', en: '$5' }, win: true, weight: 3, icon: '🪙' },
  { id: 'm6', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎫' },
];

const eggDemo = [
  { id: 'e1', label: { 'zh-TW': '$88', en: '$88' }, win: true },
  { id: 'e2', label: { 'zh-TW': '謝謝惠顧', en: 'Miss' }, win: false },
  { id: 'e3', label: { 'zh-TW': '$8', en: '$8' }, win: true },
];

const boxDemo = [
  { id: 'b1', label: { 'zh-TW': '$20', en: '$20' }, win: true },
  { id: 'b2', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false },
  { id: 'b3', label: { 'zh-TW': 'JACKPOT', en: 'JACKPOT' }, win: true },
  { id: 'b4', label: { 'zh-TW': '$5', en: '$5' }, win: true },
  { id: 'b5', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false },
];

const quizDemoQuestions: readonly QuizQuestion[] = [
  {
    q: { 'zh-TW': '哪項運動使用「愛」表示零分？', en: 'Which sport uses "love" for zero?' },
    opts: [
      { 'zh-TW': '籃球', en: 'Basketball' },
      { 'zh-TW': '網球', en: 'Tennis' },
      { 'zh-TW': '高爾夫', en: 'Golf' },
      { 'zh-TW': '橄欖球', en: 'Rugby' },
    ],
    ans: 1,
  },
  {
    q: { 'zh-TW': '世界盃足球賽幾年一次？', en: 'How often is the FIFA World Cup?' },
    opts: [
      { 'zh-TW': '2 年', en: '2 years' },
      { 'zh-TW': '4 年', en: '4 years' },
      { 'zh-TW': '5 年', en: '5 years' },
      { 'zh-TW': '3 年', en: '3 years' },
    ],
    ans: 1,
  },
  {
    q: { 'zh-TW': 'F1 賽道長度約？', en: 'F1 track length?' },
    opts: [
      { 'zh-TW': '1–2 km', en: '1–2 km' },
      { 'zh-TW': '5–7 km', en: '5–7 km' },
      { 'zh-TW': '10 km+', en: '10 km+' },
      { 'zh-TW': '3–5 km', en: '3–5 km' },
    ],
    ans: 1,
  },
];

const dollDemoPrizes = [
  { id: 'd1', label: { 'zh-TW': '泰迪熊', en: 'Teddy' }, win: true },
  { id: 'd2', label: { 'zh-TW': '貓貓', en: 'Cat' }, win: true },
  { id: 'd3', label: { 'zh-TW': '兔兔', en: 'Bunny' }, win: true },
];

// ============================================================
// Registry — 17 款 game
// ============================================================
export const registry: GameMeta[] = [
  defineGame({
    id: 'lucky-wheel',
    category: 'classic',
    icon: '🎯',
    accent: 'oklch(0.78 0.18 145)',
    title: { 'zh-TW': '幸運轉盤', en: 'Lucky Wheel' },
    shortDesc: { 'zh-TW': '8 格獎品，緩停指針', en: '8 prizes, easing pointer' },
    longDesc: {
      'zh-TW':
        '經典抽獎主力。8 片扇形獎品區，cubic-bezier 緩動停在預定獎項；支援受控 state、剩餘次數、完整 6-state 狀態機。',
      en: 'The go-to prize mechanic. 8 prize slices, cubic-bezier easing lands on a pre-chosen prize. Controlled state, remaining plays, full 6-state machine.',
    },
    Component: LuckyWheel,
    defaultProps: { prizes: luckyWheelDemoPrizes, maxPlays: 3 },
    source: { component: luckyWheelSource, types: luckyWheelTypes },
    intro: {
      'zh-TW':
        '幸運轉盤組件：支援自訂獎品、後端權威 prizeIndex、受控雙模、事件 callback、ref API。',
      en: 'Customisable wheel with server-authoritative prizeIndex, controlled state and remaining, full event callbacks, and a ref API.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: `import { LuckyWheel, PlayKitProvider } from '@play-kit/games';
import '@play-kit/games/styles.css';

<PlayKitProvider lang="zh-TW">
  <LuckyWheel prizes={prizes} maxPlays={3} onEnd={(p, i) => {}} />
</PlayKitProvider>`,
    knobs: [
      { prop: 'maxPlays', type: 'number', min: 1, max: 10, default: 3 },
      {
        prop: 'duration',
        type: 'number',
        min: 2000,
        max: 8000,
        step: 100,
        default: 4600,
        label: 'duration (ms)',
      },
      {
        prop: 'prizeIndex',
        type: 'number',
        min: -1,
        max: 7,
        default: -1,
        label: 'prizeIndex (-1 = random)',
      },
    ],
    api: {
      props: [
        {
          name: 'prizes',
          type: 'LuckyWheelPrize[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '獎品陣列（6–12 項）', en: 'Prize array (6–12 items)' },
        },
        {
          name: 'prizeIndex',
          type: 'number',
          default: '-1',
          desc: { 'zh-TW': '後端指定 index', en: 'Server-authoritative index' },
        },
        {
          name: 'duration',
          type: 'number',
          default: '4600',
          desc: { 'zh-TW': '旋轉毫秒', en: 'Spin duration (ms)' },
        },
        {
          name: 'easing',
          type: 'string',
          default: "'cubic-bezier(...)'",
          desc: { 'zh-TW': 'CSS timing function', en: 'CSS timing function' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '旋轉開始', en: 'When spin starts' },
        },
        {
          name: 'onEnd',
          params: '(prize, index) => void',
          desc: { 'zh-TW': '指針落定', en: 'When pointer lands' },
        },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎時', en: 'On win' } },
        { name: 'onLose', params: '(prize) => void', desc: { 'zh-TW': '未中時', en: 'On lose' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取時', en: 'On claim' } },
      ],
      methods: [
        {
          name: 'spin',
          signature: '(index?: number) => void',
          desc: { 'zh-TW': '啟動旋轉', en: 'Start spinning' },
        },
        {
          name: 'reset',
          signature: '() => void',
          desc: { 'zh-TW': '重置 idle', en: 'Reset to idle' },
        },
        {
          name: 'claim',
          signature: '() => void',
          desc: { 'zh-TW': '領取（限 won）', en: 'Claim (won only)' },
        },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘次數', en: 'Read remaining' },
        },
      ],
      types: 'interface LuckyWheelPrize extends Prize { color?: string; icon?: string; }',
    },
  }),
  defineGame({
    id: 'nine-grid',
    category: 'classic',
    icon: '🎰',
    accent: 'oklch(0.72 0.18 50)',
    title: { 'zh-TW': '九宮格抽獎', en: '9-Grid Lottery' },
    shortDesc: { 'zh-TW': '8 格跑燈繞圈停', en: 'Light chase around 8 cells' },
    longDesc: {
      'zh-TW': '跑燈經典：沿外圈 8 格順時針追逐，漸慢停在指定獎品格。',
      en: 'Chasing-light classic. Active state rotates clockwise through 8 outer cells, decelerating to land.',
    },
    Component: NineGrid,
    defaultProps: { cells: nineGridDemoCells, maxPlays: 3 },
    source: { component: nineGridSource, types: nineGridTypes },
    intro: {
      'zh-TW': '九宮格跑燈抽獎。中央按鈕觸發，8 格順時針追燈停於指定 cell。',
      en: '9-cell chasing-light lottery. Center button triggers chase; lights land on chosen cell.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<NineGrid cells={cells} maxPlays={3} onEnd={(p, i) => {}} />',
    knobs: [
      { prop: 'maxPlays', type: 'number', min: 1, max: 10, default: 3 },
      { prop: 'loops', type: 'number', min: 1, max: 6, default: 3 },
      { prop: 'stepInterval', type: 'number', min: 40, max: 200, step: 10, default: 80 },
      { prop: 'prizeIndex', type: 'number', min: -1, max: 7, default: -1 },
    ],
    api: {
      props: [
        {
          name: 'cells',
          type: 'NineGridCell[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '8 格獎品', en: '8 cells' },
        },
        {
          name: 'prizeIndex',
          type: 'number',
          default: '-1',
          desc: { 'zh-TW': '指定落點 0–7', en: 'Landing index 0–7' },
        },
        {
          name: 'loops',
          type: 'number',
          default: '3',
          desc: { 'zh-TW': '繞圈次數', en: 'Laps before landing' },
        },
        {
          name: 'stepInterval',
          type: 'number',
          default: '80',
          desc: { 'zh-TW': '每格間隔 ms', en: 'Per-step interval (ms)' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '跑燈啟動', en: 'When chase begins' },
        },
        {
          name: 'onEnd',
          params: '(prize, index) => void',
          desc: { 'zh-TW': '落定時', en: 'On landing' },
        },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎時', en: 'On win' } },
        { name: 'onLose', params: '(prize) => void', desc: { 'zh-TW': '未中時', en: 'On lose' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取時', en: 'On claim' } },
      ],
      methods: [
        {
          name: 'start',
          signature: '(index?: number) => void',
          desc: { 'zh-TW': '啟動', en: 'Start' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
      ],
      types: 'interface NineGridCell extends Prize { icon?: string; }',
    },
  }),
  defineGame({
    id: 'marquee',
    category: 'loyalty',
    icon: '🎫',
    accent: 'oklch(0.72 0.18 50)',
    title: { 'zh-TW': '跑馬燈抽獎', en: 'Marquee Lottery' },
    shortDesc: { 'zh-TW': '橫向跑燈停定', en: 'Horizontal light chase' },
    longDesc: {
      'zh-TW': '6 格水平獎品跑燈，按鈕啟動，漸停指定獎項。',
      en: '6 horizontal prize cells; chase decelerates to target.',
    },
    Component: Marquee,
    defaultProps: { prizes: marqueeDemoPrizes, maxPlays: 3 },
    source: { component: marqueeSource, types: marqueeTypes },
    intro: { 'zh-TW': '橫向跑燈抽獎組件。', en: 'Horizontal marquee lottery.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<Marquee prizes={prizes} maxPlays={3} />',
    knobs: [
      { prop: 'maxPlays', type: 'number', min: 1, max: 10, default: 3 },
      { prop: 'loops', type: 'number', min: 1, max: 6, default: 3 },
      { prop: 'prizeIndex', type: 'number', min: -1, max: 5, default: -1 },
    ],
    api: {
      props: [
        {
          name: 'prizes',
          type: 'MarqueePrize[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '獎品列表', en: 'Prize list' },
        },
        {
          name: 'prizeIndex',
          type: 'number',
          default: '-1',
          desc: { 'zh-TW': '指定落點', en: 'Target index' },
        },
        { name: 'loops', type: 'number', default: '3', desc: { 'zh-TW': '繞圈', en: 'Laps' } },
        {
          name: 'stepInterval',
          type: 'number',
          default: '70',
          desc: { 'zh-TW': '步間隔 ms', en: 'Step interval (ms)' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '跑燈開始', en: 'Marquee start' },
        },
        {
          name: 'onEnd',
          params: '(prize, index) => void',
          desc: { 'zh-TW': '落定時', en: 'On land' },
        },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎時', en: 'On win' } },
        { name: 'onLose', params: '(prize) => void', desc: { 'zh-TW': '未中時', en: 'On miss' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取時', en: 'On claim' } },
      ],
      methods: [
        {
          name: 'start',
          signature: '(index?: number) => void',
          desc: { 'zh-TW': '啟動', en: 'Start' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
      ],
      types: 'interface MarqueePrize extends Prize { icon?: string; }',
    },
  }),
  defineGame({
    id: 'slot-machine',
    category: 'classic',
    icon: '🎲',
    accent: 'oklch(0.72 0.22 25)',
    title: { 'zh-TW': '老虎機', en: 'Slot Machine' },
    shortDesc: { 'zh-TW': '3 輪錯開停止', en: '3 reels, staggered stop' },
    longDesc: {
      'zh-TW': '3 個滾輪分別錯開停止，三同則中獎。',
      en: '3 reels stop staggered; triple-match wins.',
    },
    Component: SlotMachine,
    defaultProps: { maxPlays: 5 },
    source: { component: slotMachineSource, types: slotMachineTypes },
    intro: {
      'zh-TW': '老虎機組件，支援自訂符號、停止時序、後端權威。',
      en: 'Slot machine with customisable symbols and stop timings.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<SlotMachine maxPlays={5} />',
    knobs: [
      { prop: 'maxPlays', type: 'number', min: 1, max: 10, default: 5 },
      { prop: 'reelCount', type: 'number', min: 3, max: 5, default: 3 },
      { prop: 'winRate', type: 'number', min: 0, max: 1, step: 0.05, default: 0.28 },
    ],
    api: {
      props: [
        {
          name: 'symbols',
          type: 'readonly string[]',
          default: "['🍒','🍋','🔔','⭐','💎','7️⃣']",
          desc: { 'zh-TW': '輪子符號', en: 'Reel symbols' },
        },
        {
          name: 'reelCount',
          type: 'number',
          default: '3',
          desc: { 'zh-TW': '輪數', en: 'Reel count' },
        },
        {
          name: 'winRate',
          type: 'number',
          default: '0.28',
          desc: { 'zh-TW': '強制三同機率', en: 'Force-triple probability' },
        },
        {
          name: 'forcedSymbols',
          type: 'number[]',
          default: '—',
          desc: { 'zh-TW': '後端指定結果', en: 'Server-authoritative result' },
        },
        {
          name: 'stopTimes',
          type: 'number[]',
          default: '[1100,1700,2400]',
          desc: { 'zh-TW': '各輪停止 ms', en: 'Per-reel stop (ms)' },
        },
        ...REMAINING_PROPS_5,
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '旋轉開始', en: 'Spin start' } },
        {
          name: 'onEnd',
          params: '(symbols, won) => void',
          desc: { 'zh-TW': '全部停止', en: 'All reels stopped' },
        },
        { name: 'onWin', params: '(symbols) => void', desc: { 'zh-TW': '中獎時', en: 'On win' } },
        { name: 'onLose', params: '(symbols) => void', desc: { 'zh-TW': '未中時', en: 'On miss' } },
        {
          name: 'onClaim',
          params: '(symbols) => void',
          desc: { 'zh-TW': '領取時', en: 'On claim' },
        },
      ],
      methods: [
        {
          name: 'spin',
          signature: '(forced?: number[]) => void',
          desc: { 'zh-TW': '啟動', en: 'Start' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
        {
          name: 'getReels',
          signature: '() => number[]',
          desc: { 'zh-TW': '讀當前輪', en: 'Read current reels' },
        },
      ],
      types: 'type SlotMachineProps = { symbols?: readonly string[]; reelCount?: number; ... }',
    },
  }),
  defineGame({
    id: 'smash-egg',
    category: 'classic',
    icon: '🥚',
    accent: 'oklch(0.68 0.2 280)',
    title: { 'zh-TW': '砸金蛋', en: 'Smash Egg' },
    shortDesc: { 'zh-TW': '選一顆，落錘揭獎', en: 'Pick · smash · reveal' },
    longDesc: {
      'zh-TW': '選擇一顆金蛋，落錘動畫，揭露對應獎品。',
      en: 'Pick one egg; hammer swings; prize revealed.',
    },
    Component: SmashEgg,
    defaultProps: { eggs: eggDemo },
    source: { component: smashEggSource, types: smashEggTypes },
    intro: {
      'zh-TW': '砸金蛋組件，每顆蛋對應一個獎品。',
      en: 'Smash-egg component; each egg maps to a prize.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<SmashEgg eggs={eggs} />',
    knobs: [
      { prop: 'hammerDelayMs', type: 'number', min: 200, max: 1500, step: 100, default: 700 },
      { prop: 'revealDelayMs', type: 'number', min: 200, max: 1500, step: 100, default: 700 },
    ],
    api: {
      props: [
        {
          name: 'eggs',
          type: 'Prize[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '每顆蛋對應獎品', en: 'Egg → prize' },
        },
        {
          name: 'hammerDelayMs',
          type: 'number',
          default: '700',
          desc: { 'zh-TW': '落錘延遲', en: 'Hammer delay' },
        },
        {
          name: 'revealDelayMs',
          type: 'number',
          default: '700',
          desc: { 'zh-TW': '揭獎延遲', en: 'Reveal delay' },
        },
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '選擇蛋後', en: 'After egg picked' },
        },
        {
          name: 'onEnd',
          params: '(prize, index) => void',
          desc: { 'zh-TW': '揭曉', en: 'Reveal' },
        },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎', en: 'Won' } },
        { name: 'onLose', params: '(prize) => void', desc: { 'zh-TW': '未中', en: 'Missed' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'pick',
          signature: '(index: number) => void',
          desc: { 'zh-TW': '選擇蛋', en: 'Pick an egg' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getPicked',
          signature: '() => number | null',
          desc: { 'zh-TW': '讀選擇', en: 'Read selected index' },
        },
      ],
      types: 'interface SmashEggProps { eggs: readonly Prize[]; hammerDelayMs?: number; ... }',
    },
  }),
  defineGame({
    id: 'gift-box',
    category: 'classic',
    icon: '🎁',
    accent: 'oklch(0.62 0.21 22)',
    title: { 'zh-TW': '禮盒開箱', en: 'Gift Box' },
    shortDesc: { 'zh-TW': '5 盒擇一，開箱揭獎', en: 'Pick 1 of 5 boxes' },
    longDesc: {
      'zh-TW': '5 個禮盒擇一，蓋子飛開揭露獎品。',
      en: 'Choose from 5 gift boxes; lid lifts to reveal prize.',
    },
    Component: GiftBox,
    defaultProps: { boxes: boxDemo },
    source: { component: giftBoxSource, types: giftBoxTypes },
    intro: { 'zh-TW': '禮盒組件，每盒對應一個獎品。', en: 'Gift-box; each box maps to a prize.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<GiftBox boxes={boxes} />',
    knobs: [{ prop: 'openDelayMs', type: 'number', min: 200, max: 1500, step: 100, default: 700 }],
    api: {
      props: [
        {
          name: 'boxes',
          type: 'Prize[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '禮盒 → 獎品', en: 'Box → prize' },
        },
        {
          name: 'openDelayMs',
          type: 'number',
          default: '700',
          desc: { 'zh-TW': '開箱延遲', en: 'Open delay' },
        },
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '選擇盒後', en: 'After box picked' },
        },
        {
          name: 'onEnd',
          params: '(prize, index) => void',
          desc: { 'zh-TW': '揭曉', en: 'Reveal' },
        },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎', en: 'Won' } },
        { name: 'onLose', params: '(prize) => void', desc: { 'zh-TW': '未中', en: 'Missed' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'pick',
          signature: '(index: number) => void',
          desc: { 'zh-TW': '選擇盒', en: 'Pick a box' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getPicked',
          signature: '() => number | null',
          desc: { 'zh-TW': '讀選擇', en: 'Read selected index' },
        },
      ],
      types: 'interface GiftBoxProps { boxes: readonly Prize[]; openDelayMs?: number; ... }',
    },
  }),
  defineGame({
    id: 'lotto-roll',
    category: 'classic',
    icon: '🎱',
    accent: 'oklch(0.82 0.14 82)',
    title: { 'zh-TW': '彩球開獎', en: 'Lotto Roll' },
    shortDesc: { 'zh-TW': '號碼球逐顆揭曉', en: 'Balls revealed one by one' },
    longDesc: {
      'zh-TW': '從號碼池抽取數顆號碼球，依規則判定勝敗。',
      en: 'Draw balls from pool; win by rule.',
    },
    Component: LottoRoll,
    defaultProps: { maxPlays: 2 },
    source: { component: lottoRollSource, types: lottoRollTypes },
    intro: {
      'zh-TW': '彩球開獎機，支援自訂勝利規則。',
      en: 'Ball-drawing machine with custom win checker.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<LottoRoll poolSize={49} pickCount={6} />',
    knobs: [
      { prop: 'poolSize', type: 'number', min: 10, max: 99, default: 49 },
      { prop: 'pickCount', type: 'number', min: 3, max: 8, default: 6 },
      { prop: 'pickIntervalMs', type: 'number', min: 400, max: 2000, step: 100, default: 900 },
    ],
    api: {
      props: [
        {
          name: 'poolSize',
          type: 'number',
          default: '49',
          desc: { 'zh-TW': '號碼池', en: 'Pool size' },
        },
        {
          name: 'pickCount',
          type: 'number',
          default: '6',
          desc: { 'zh-TW': '抽幾顆', en: 'Picks' },
        },
        {
          name: 'forcedNumbers',
          type: 'number[]',
          default: '—',
          desc: { 'zh-TW': '指定結果', en: 'Forced result' },
        },
        {
          name: 'pickIntervalMs',
          type: 'number',
          default: '900',
          desc: { 'zh-TW': '揭曉間隔 ms', en: 'Reveal interval (ms)' },
        },
        {
          name: 'winChecker',
          type: '(drawn) => boolean',
          default: '預設規則',
          desc: { 'zh-TW': '勝利判定', en: 'Win check' },
        },
        ...REMAINING_PROPS_2,
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開獎啟動', en: 'Draw start' } },
        {
          name: 'onEnd',
          params: '(numbers, won) => void',
          desc: { 'zh-TW': '全部揭曉', en: 'All numbers drawn' },
        },
        { name: 'onWin', params: '(numbers) => void', desc: { 'zh-TW': '中獎', en: 'Won' } },
        { name: 'onLose', params: '(numbers) => void', desc: { 'zh-TW': '未中', en: 'Missed' } },
        { name: 'onClaim', params: '(numbers) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'draw',
          signature: '(forced?: number[]) => void',
          desc: { 'zh-TW': '開獎', en: 'Draw' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
        {
          name: 'getNumbers',
          signature: '() => number[]',
          desc: { 'zh-TW': '讀號碼', en: 'Read numbers' },
        },
      ],
      types: 'interface LottoRollProps { poolSize?: number; pickCount?: number; ... }',
    },
  }),
  defineGame({
    id: 'gift-rain',
    category: 'classic',
    icon: '🧧',
    accent: 'oklch(0.72 0.22 25)',
    title: { 'zh-TW': '紅包雨', en: 'Gift Rain' },
    shortDesc: { 'zh-TW': '限時接紅包', en: 'Catch falling envelopes' },
    longDesc: {
      'zh-TW': '時限內點擊落下的紅包得分（紅包 +1、金幣 +3、炸彈 −2），分數達 scoreToWin 即勝。',
      en: 'Tap falling drops within time (red +1 / gold +3 / bomb −2); win when score reaches scoreToWin.',
    },
    Component: GiftRain,
    defaultProps: {},
    source: { component: giftRainSource, types: giftRainTypes },
    intro: {
      'zh-TW': '紅包雨組件，支援多種 drop 類型。',
      en: 'Gift-rain with multiple drop kinds.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<GiftRain durationSec={10} scoreToWin={8} />',
    knobs: [
      { prop: 'durationSec', type: 'number', min: 5, max: 30, default: 10 },
      { prop: 'scoreToWin', type: 'number', min: 3, max: 30, default: 8 },
      { prop: 'spawnIntervalMs', type: 'number', min: 200, max: 800, step: 20, default: 380 },
    ],
    api: {
      props: [
        {
          name: 'durationSec',
          type: 'number',
          default: '10',
          desc: { 'zh-TW': '遊戲時長', en: 'Duration (s)' },
        },
        {
          name: 'scoreToWin',
          type: 'number',
          default: '8',
          desc: { 'zh-TW': '勝利分數', en: 'Score to win' },
        },
        {
          name: 'spawnIntervalMs',
          type: 'number',
          default: '380',
          desc: { 'zh-TW': '產生間隔 ms', en: 'Spawn interval (ms)' },
        },
        {
          name: 'dropDurationRangeMs',
          type: '[number, number]',
          default: '[2400, 3800]',
          desc: { 'zh-TW': '掉落時長區間', en: 'Fall duration range' },
        },
        {
          name: 'kindProbabilities',
          type: 'Record<DropKind, number>',
          default: '{ gold:0.12, bomb:0.16, red:0.72 }',
          desc: { 'zh-TW': '各類掉落物機率', en: 'Per-kind drop probability' },
        },
        {
          name: 'scoreByKind',
          type: 'Record<DropKind, number>',
          default: '{ red:+1, gold:+3, bomb:-2 }',
          desc: {
            'zh-TW': '各類分數（bomb 為負分，接到扣分）',
            en: 'Per-kind score delta (bomb is negative — catching deducts)',
          },
        },
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onCatch',
          params: '(drop, scoreDelta) => void',
          desc: {
            'zh-TW': '捕獲一個 drop；scoreDelta 為本次分數變動（bomb 為負值）',
            en: 'A drop was caught; scoreDelta is the score change (negative for bomb)',
          },
        },
        { name: 'onEnd', params: '(score, won) => void', desc: { 'zh-TW': '結算', en: 'Settle' } },
        { name: 'onWin', params: '(score) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '(score) => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '(score) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'start', signature: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'tap',
          signature: '(id: number) => void',
          desc: { 'zh-TW': '捕獲 drop', en: 'Caught a drop' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getScore',
          signature: '() => number',
          desc: { 'zh-TW': '讀分數', en: 'Read score' },
        },
        {
          name: 'getTimeLeft',
          signature: '() => number',
          desc: { 'zh-TW': '讀時間', en: 'Read time left' },
        },
      ],
      types: "type DropKind = 'red' | 'gold' | 'bomb';",
    },
  }),
  defineGame({
    id: 'doll-machine',
    category: 'skill',
    icon: '🧸',
    accent: 'oklch(0.72 0.22 305)',
    title: { 'zh-TW': '夾娃娃機', en: 'Doll Machine' },
    shortDesc: { 'zh-TW': '按鈕試夾，機率中獎', en: 'Try grab; rate-based' },
    longDesc: {
      'zh-TW': '夾娃娃機簡化版：試夾按鈕觸發，以 winRate 或 forcedOutcome 決定勝負。',
      en: 'Simplified doll machine; try-grab triggers win/lose.',
    },
    Component: DollMachine,
    defaultProps: { prizes: dollDemoPrizes, maxPlays: 3 },
    source: { component: dollMachineSource, types: dollMachineTypes },
    intro: {
      'zh-TW': '夾娃娃機組件，後端權威模式可強制 forcedOutcome。',
      en: 'Doll machine with optional forcedOutcome.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<DollMachine prizes={prizes} winRate={0.3} />',
    knobs: [
      { prop: 'maxPlays', type: 'number', min: 1, max: 10, default: 3 },
      { prop: 'winRate', type: 'number', min: 0, max: 1, step: 0.05, default: 0.3 },
      { prop: 'grabDurationMs', type: 'number', min: 500, max: 3000, step: 100, default: 1600 },
    ],
    api: {
      props: [
        {
          name: 'prizes',
          type: 'Prize[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '獎品池', en: 'Prize pool' },
        },
        {
          name: 'winRate',
          type: 'number',
          default: '0.3',
          desc: { 'zh-TW': '中獎機率', en: 'Win probability' },
        },
        {
          name: 'forcedOutcome',
          type: 'boolean',
          default: '—',
          desc: { 'zh-TW': '強制勝敗', en: 'Forced win/lose' },
        },
        {
          name: 'forcedPrizeIndex',
          type: 'number',
          default: '—',
          desc: { 'zh-TW': '指定 prize', en: 'Forced prize index' },
        },
        {
          name: 'targetX',
          type: 'number',
          default: '70',
          desc: { 'zh-TW': '目標娃娃 x%', en: 'Target doll x%' },
        },
        {
          name: 'tolerance',
          type: 'number',
          default: '12',
          desc: { 'zh-TW': '命中容差 %', en: 'Hit tolerance %' },
        },
        {
          name: 'sliderSpeed',
          type: 'number',
          default: '0.55',
          desc: { 'zh-TW': 'claw 擺動速度', en: 'Claw slide speed' },
        },
        {
          name: 'grabDurationMs',
          type: 'number',
          default: '1600',
          desc: { 'zh-TW': '動畫毫秒', en: 'Animation (ms)' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '夾取動畫啟動', en: 'Grab animation start' },
        },
        { name: 'onEnd', params: '(prize, won) => void', desc: { 'zh-TW': '結算', en: 'Settle' } },
        { name: 'onWin', params: '(prize) => void', desc: { 'zh-TW': '中獎', en: 'Won' } },
        { name: 'onLose', params: '() => void', desc: { 'zh-TW': '未中', en: 'Missed' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'tryGrab', signature: '() => void', desc: { 'zh-TW': '試夾', en: 'Try grab' } },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
      ],
      types: 'interface DollMachineProps { prizes: readonly Prize[]; winRate?: number; ... }',
    },
  }),
  defineGame({
    id: 'flip-match',
    category: 'skill',
    icon: '🃏',
    accent: 'oklch(0.72 0.18 180)',
    title: { 'zh-TW': '翻牌配對', en: 'Flip & Match' },
    shortDesc: { 'zh-TW': '記憶配對經典', en: 'Memory pairing' },
    longDesc: {
      'zh-TW': '翻牌配對遊戲。全配對即勝，計步與時間。',
      en: 'Memory pair game; all matched wins.',
    },
    Component: FlipMatch,
    defaultProps: {},
    source: { component: flipMatchSource, types: flipMatchTypes },
    intro: { 'zh-TW': '翻牌配對組件，支援自訂符號集。', en: 'Flip & match with custom symbols.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: `<FlipMatch symbols={['⚽','🏀','🎾']} />`,
    knobs: [
      { prop: 'matchDelayMs', type: 'number', min: 100, max: 1000, step: 50, default: 400 },
      { prop: 'mismatchDelayMs', type: 'number', min: 300, max: 2000, step: 100, default: 900 },
    ],
    api: {
      props: [
        {
          name: 'symbols',
          type: 'readonly string[]',
          default: "['⚽','🏀','🎾','🏈','⚾','🏐']",
          desc: { 'zh-TW': '配對符號（每張會出現兩次）', en: 'Pair symbols (each appears twice)' },
        },
        {
          name: 'matchDelayMs',
          type: 'number',
          default: '400',
          desc: { 'zh-TW': '配對保留 ms', en: 'Keep-open delay' },
        },
        {
          name: 'mismatchDelayMs',
          type: 'number',
          default: '900',
          desc: { 'zh-TW': '翻回延遲', en: 'Flip-back delay' },
        },
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '首次翻牌', en: 'First flip' } },
        {
          name: 'onMatch',
          params: '(symbol) => void',
          desc: { 'zh-TW': '配對成功', en: 'Match succeeded' },
        },
        {
          name: 'onMismatch',
          params: '() => void',
          desc: { 'zh-TW': '配對失敗', en: 'Match failed' },
        },
        {
          name: 'onEnd',
          params: '(moves, sec) => void',
          desc: { 'zh-TW': '通關', en: 'Completed' },
        },
        { name: 'onWin', params: '(moves, sec) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onClaim', params: '(moves, sec) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'flip',
          signature: '(index: number) => void',
          desc: { 'zh-TW': '翻牌', en: 'Flip card' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重洗', en: 'Reshuffle' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getMoves',
          signature: '() => number',
          desc: { 'zh-TW': '讀步數', en: 'Read moves' },
        },
        {
          name: 'getTime',
          signature: '() => number',
          desc: { 'zh-TW': '讀秒數', en: 'Read seconds left' },
        },
      ],
      types:
        'interface FlipMatchCard { id: number; symbol: string; flipped: boolean; matched: boolean; }',
    },
  }),
  defineGame({
    id: 'quiz',
    category: 'skill',
    icon: '🧠',
    accent: 'oklch(0.68 0.2 280)',
    title: { 'zh-TW': '問答闖關', en: 'Trivia Quiz' },
    shortDesc: { 'zh-TW': '限時答題闖關', en: 'Timed trivia' },
    longDesc: { 'zh-TW': '每題倒數，答對達標即勝。', en: 'Timed Q&A; win by passing score.' },
    Component: Quiz,
    defaultProps: { questions: quizDemoQuestions, passScore: 2 },
    source: { component: quizSource, types: quizTypes },
    intro: {
      'zh-TW': '問答組件，支援多題、倒數、即時回饋。',
      en: 'Quiz with countdown and feedback.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<Quiz questions={qs} passScore={2} />',
    knobs: [
      { prop: 'questionTimeSec', type: 'number', min: 3, max: 30, default: 10 },
      { prop: 'passScore', type: 'number', min: 1, max: 10, default: 2 },
      { prop: 'feedbackMs', type: 'number', min: 300, max: 3000, step: 100, default: 1200 },
    ],
    api: {
      props: [
        {
          name: 'questions',
          type: 'QuizQuestion[]',
          required: true,
          default: '[]',
          desc: { 'zh-TW': '題庫', en: 'Questions' },
        },
        {
          name: 'questionTimeSec',
          type: 'number',
          default: '10',
          desc: { 'zh-TW': '每題倒數', en: 'Per-question time (s)' },
        },
        {
          name: 'passScore',
          type: 'number',
          default: '2',
          desc: { 'zh-TW': '過關所需', en: 'Score to pass' },
        },
        {
          name: 'feedbackMs',
          type: 'number',
          default: '1200',
          desc: { 'zh-TW': '回饋停留', en: 'Feedback delay' },
        },
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onAnswer',
          params: '(qIdx, sel, correct) => void',
          desc: { 'zh-TW': '答題', en: 'Answer a question' },
        },
        {
          name: 'onEnd',
          params: '(score, total, won) => void',
          desc: { 'zh-TW': '結算', en: 'Settle' },
        },
        { name: 'onWin', params: '(score) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '(score) => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '(score) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'start', signature: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'answer',
          signature: '(index: number) => void',
          desc: { 'zh-TW': '作答', en: 'Answer submitted' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getScore',
          signature: '() => number',
          desc: { 'zh-TW': '讀分數', en: 'Read score' },
        },
        {
          name: 'getQuestionIndex',
          signature: '() => number',
          desc: { 'zh-TW': '讀當前題', en: 'Read current question index' },
        },
      ],
      types: 'interface QuizQuestion { q: Text; opts: Text[]; ans: number; }',
    },
  }),
  defineGame({
    id: 'ring-toss',
    category: 'skill',
    icon: '🎯',
    accent: 'oklch(0.82 0.14 82)',
    title: { 'zh-TW': '套圈圈', en: 'Ring Toss' },
    shortDesc: { 'zh-TW': '時機套中柱子', en: 'Time your toss' },
    longDesc: {
      'zh-TW': 'slider 左右擺動，按鈕投擲；命中數達標即勝。',
      en: 'Slider oscillates; toss on target; win by hits.',
    },
    Component: RingToss,
    defaultProps: {},
    source: { component: ringTossSource, types: ringTossTypes },
    intro: { 'zh-TW': '套圈圈組件，時機類遊戲。', en: 'Ring-toss timing game.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<RingToss attempts={3} hitsToWin={2} />',
    knobs: [
      { prop: 'attempts', type: 'number', min: 1, max: 10, default: 3 },
      { prop: 'hitsToWin', type: 'number', min: 1, max: 10, default: 2 },
      { prop: 'tolerance', type: 'number', min: 3, max: 30, default: 9 },
      { prop: 'sliderSpeed', type: 'number', min: 0.3, max: 4, step: 0.1, default: 1.1 },
    ],
    api: {
      props: [
        {
          name: 'attempts',
          type: 'number',
          default: '3',
          desc: { 'zh-TW': '投擲次數', en: 'Attempts' },
        },
        {
          name: 'hitsToWin',
          type: 'number',
          default: '2',
          desc: { 'zh-TW': '勝利命中', en: 'Hits to win' },
        },
        { name: 'pegX', type: 'number', default: '50', desc: { 'zh-TW': '柱子 x%', en: 'Peg x%' } },
        {
          name: 'tolerance',
          type: 'number',
          default: '9',
          desc: { 'zh-TW': '命中容差', en: 'Hit tolerance' },
        },
        {
          name: 'sliderSpeed',
          type: 'number',
          default: '1.1',
          desc: { 'zh-TW': 'slider 速度', en: 'Slider speed' },
        },
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onToss',
          params: '(pos, hit) => void',
          desc: { 'zh-TW': '每次投擲', en: 'On each toss' },
        },
        { name: 'onEnd', params: '(hits, won) => void', desc: { 'zh-TW': '結算', en: 'Settle' } },
        { name: 'onWin', params: '(hits) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '(hits) => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '(hits) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'start', signature: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        { name: 'toss', signature: '() => void', desc: { 'zh-TW': '投擲', en: 'Toss' } },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getHits',
          signature: '() => number',
          desc: { 'zh-TW': '讀命中', en: 'Read hits' },
        },
        {
          name: 'getAttemptsLeft',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘投擲', en: 'Read attempts left' },
        },
      ],
      types: 'interface RingTossProps { attempts?: number; hitsToWin?: number; ... }',
    },
  }),
  defineGame({
    id: 'shake',
    category: 'skill',
    icon: '💥',
    accent: 'oklch(0.7 0.2 25)',
    title: { 'zh-TW': '搖一搖', en: 'Shake to Win' },
    shortDesc: { 'zh-TW': '時限內點擊達標', en: 'Tap within time' },
    longDesc: {
      'zh-TW': '時限內點擊次數達標即勝。',
      en: 'Tap the target X times within N seconds.',
    },
    Component: Shake,
    defaultProps: {},
    source: { component: shakeSource, types: shakeTypes },
    intro: { 'zh-TW': '反應類遊戲。快速點擊達目標即勝。', en: 'Reaction game — tap fast to win.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<Shake tapsToWin={20} durationSec={5} />',
    knobs: [
      { prop: 'tapsToWin', type: 'number', min: 5, max: 50, default: 20 },
      { prop: 'durationSec', type: 'number', min: 3, max: 20, default: 5 },
    ],
    api: {
      props: [
        {
          name: 'tapsToWin',
          type: 'number',
          default: '20',
          desc: { 'zh-TW': '點擊目標', en: 'Taps required' },
        },
        {
          name: 'durationSec',
          type: 'number',
          default: '5',
          desc: { 'zh-TW': '倒數秒', en: 'Countdown (s)' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onTap',
          params: '(count) => void',
          desc: { 'zh-TW': '每次敲擊', en: 'On each tap' },
        },
        { name: 'onEnd', params: '(won, count) => void', desc: { 'zh-TW': '結算', en: 'Settle' } },
        { name: 'onWin', params: '() => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '() => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'start', signature: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        { name: 'tap', signature: '() => void', desc: { 'zh-TW': '敲擊', en: 'Tap' } },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getCount',
          signature: '() => number',
          desc: { 'zh-TW': '讀點擊', en: 'Read tap count' },
        },
        {
          name: 'getTimeLeft',
          signature: '() => number',
          desc: { 'zh-TW': '讀時間', en: 'Read time left' },
        },
      ],
      types: 'interface ShakeProps { tapsToWin?: number; durationSec?: number; ... }',
    },
  }),
  defineGame({
    id: 'shake-dice',
    category: 'skill',
    icon: '🎲',
    accent: 'oklch(0.68 0.14 200)',
    title: { 'zh-TW': '搖骰子', en: 'Shake Dice' },
    shortDesc: { 'zh-TW': '點數 ≥ 門檻即勝', en: 'Sum ≥ threshold wins' },
    longDesc: {
      'zh-TW':
        '搖 N 顆骰子，總點數 ≥ winThreshold 即勝。啟用 `tripleAlsoWins=true`（預設關）時三同也算勝。',
      en: 'Shake N dice; win when sum ≥ winThreshold. Opt-in `tripleAlsoWins=true` also counts triples as wins (default off).',
    },
    Component: ShakeDice,
    defaultProps: { maxPlays: 3 },
    source: { component: shakeDiceSource, types: shakeDiceTypes },
    intro: {
      'zh-TW': '搖骰子組件，可指定骰數、面數、勝利門檻。',
      en: 'Dice with configurable count, faces, win threshold.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<ShakeDice diceCount={3} winThreshold={14} />',
    knobs: [
      { prop: 'diceCount', type: 'number', min: 1, max: 5, default: 3 },
      { prop: 'faces', type: 'number', min: 4, max: 12, default: 6 },
      { prop: 'winThreshold', type: 'number', min: 3, max: 30, default: 14 },
      { prop: 'shakeDurationMs', type: 'number', min: 500, max: 3000, step: 100, default: 1600 },
    ],
    api: {
      props: [
        {
          name: 'diceCount',
          type: 'number',
          default: '3',
          desc: { 'zh-TW': '骰數', en: 'Dice count' },
        },
        {
          name: 'faces',
          type: 'number',
          default: '6',
          desc: { 'zh-TW': '面數', en: 'Face count' },
        },
        {
          name: 'winThreshold',
          type: 'number',
          default: '14',
          desc: { 'zh-TW': '勝利門檻（sum ≥ 此值）', en: 'Win threshold (sum ≥ value)' },
        },
        {
          name: 'tripleAlsoWins',
          type: 'boolean',
          default: 'false',
          desc: { 'zh-TW': '三同也算勝', en: 'Triple also wins' },
        },
        {
          name: 'shakeDurationMs',
          type: 'number',
          default: '1600',
          desc: { 'zh-TW': '搖晃時長', en: 'Shake duration' },
        },
        {
          name: 'forcedFaces',
          type: 'number[]',
          default: '—',
          desc: { 'zh-TW': '指定點數', en: 'Forced faces' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onEnd',
          params: '(faces, sum, won) => void',
          desc: { 'zh-TW': '結算', en: 'Settle' },
        },
        { name: 'onWin', params: '(faces, sum) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '(faces, sum) => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '(faces, sum) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'roll',
          signature: '(forced?: number[]) => void',
          desc: { 'zh-TW': '搖骰', en: 'Roll dice' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
        {
          name: 'getFaces',
          signature: '() => number[]',
          desc: { 'zh-TW': '讀點數', en: 'Read dice faces' },
        },
      ],
      types: 'interface ShakeDiceProps { diceCount?: number; winThreshold?: number; ... }',
    },
  }),
  defineGame({
    id: 'guess-gift',
    category: 'skill',
    icon: '🥤',
    accent: 'oklch(0.68 0.2 25)',
    title: { 'zh-TW': '三杯蓋球', en: 'Shell Game' },
    shortDesc: { 'zh-TW': '眼力尋球', en: 'Spot the ball' },
    longDesc: {
      'zh-TW': '先亮球，杯子交換後猜球位置。',
      en: 'Ball shown, cups swap, guess the position.',
    },
    Component: GuessGift,
    defaultProps: { maxPlays: 3 },
    source: { component: guessGiftSource, types: guessGiftTypes },
    intro: { 'zh-TW': '三杯蓋球組件。', en: 'Classic shell game.' },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<GuessGift cupCount={3} swapCount={7} />',
    knobs: [
      { prop: 'cupCount', type: 'number', min: 2, max: 5, default: 3 },
      { prop: 'swapCount', type: 'number', min: 1, max: 15, default: 7 },
      { prop: 'swapDurationMs', type: 'number', min: 200, max: 1200, step: 50, default: 650 },
    ],
    api: {
      props: [
        {
          name: 'cupCount',
          type: 'number',
          default: '3',
          desc: { 'zh-TW': '杯子數', en: 'Cup count' },
        },
        {
          name: 'swapCount',
          type: 'number',
          default: '7',
          desc: { 'zh-TW': '交換次數', en: 'Swap count' },
        },
        {
          name: 'swapDurationMs',
          type: 'number',
          default: '650',
          desc: { 'zh-TW': '交換時長', en: 'Swap duration' },
        },
        {
          name: 'revealMs',
          type: 'number',
          default: '900',
          desc: { 'zh-TW': '初始亮球 ms', en: 'Initial reveal (ms)' },
        },
        {
          name: 'ballCupIndex',
          type: 'number',
          default: '-1',
          desc: { 'zh-TW': '球所在杯', en: 'Ball cup index' },
        },
        ...REMAINING_PROPS,
        ...BASE_PROPS,
      ],
      events: [
        { name: 'onStart', params: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'onPick',
          params: '(slot, ball, correct) => void',
          desc: { 'zh-TW': '選擇', en: 'Pick' },
        },
        { name: 'onEnd', params: '(won) => void', desc: { 'zh-TW': '結算', en: 'Settle' } },
        { name: 'onWin', params: '() => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onLose', params: '() => void', desc: { 'zh-TW': '失敗', en: 'Lost' } },
        { name: 'onClaim', params: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        { name: 'start', signature: '() => void', desc: { 'zh-TW': '開始', en: 'Start' } },
        {
          name: 'pick',
          signature: '(slot: number) => void',
          desc: { 'zh-TW': '選擇杯', en: 'Pick a cup' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getRemaining',
          signature: '() => number',
          desc: { 'zh-TW': '讀剩餘', en: 'Read remaining' },
        },
        {
          name: 'getBallCup',
          signature: '() => number',
          desc: { 'zh-TW': '讀球位', en: 'Read ball cup' },
        },
      ],
      types: 'interface GuessGiftProps { cupCount?: number; swapCount?: number; ... }',
    },
  }),
  defineGame({
    id: 'scratch-card',
    category: 'classic',
    icon: '💳',
    accent: 'oklch(0.7 0.2 25)',
    title: { 'zh-TW': '刮刮樂', en: 'Scratch Card' },
    shortDesc: { 'zh-TW': '拖曳刮除揭曉', en: 'Drag to scratch' },
    longDesc: {
      'zh-TW': '拖曳卡面累積刮除比例，達門檻自動揭曉獎項。',
      en: 'Drag to scratch; auto-reveal at threshold.',
    },
    Component: ScratchCard,
    defaultProps: {
      prize: { id: 'sc', label: { 'zh-TW': '$100', en: '$100' }, win: true },
    },
    source: { component: scratchCardSource, types: scratchCardTypes },
    intro: {
      'zh-TW': '刮刮樂組件，支援 pointer 拖曳或 ref imperative 刮除。',
      en: 'Scratch card; supports pointer drag or imperative scratch.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<ScratchCard prize={prize} revealThreshold={0.55} />',
    knobs: [
      { prop: 'revealThreshold', type: 'number', min: 0.1, max: 1, step: 0.05, default: 0.55 },
      { prop: 'scratchGain', type: 'number', min: 0.005, max: 0.1, step: 0.005, default: 0.02 },
    ],
    api: {
      props: [
        {
          name: 'prize',
          type: 'Prize',
          required: true,
          default: '—',
          desc: { 'zh-TW': '卡下獎品', en: 'Prize underneath' },
        },
        {
          name: 'revealThreshold',
          type: 'number',
          default: '0.55',
          desc: { 'zh-TW': '揭曉門檻 (0–1)', en: 'Reveal threshold (0–1)' },
        },
        {
          name: 'scratchGain',
          type: 'number',
          default: '0.02',
          desc: { 'zh-TW': '每次 move 累積', en: 'Per-move gain' },
        },
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onStart',
          params: '() => void',
          desc: { 'zh-TW': '首次 scratch', en: 'First scratch' },
        },
        {
          name: 'onProgress',
          params: '(ratio) => void',
          desc: { 'zh-TW': '刮除比例變動', en: 'Scratch progress changed' },
        },
        { name: 'onReveal', params: '(prize) => void', desc: { 'zh-TW': '揭曉', en: 'Reveal' } },
        { name: 'onClaim', params: '(prize) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'scratch',
          signature: '(delta?: number) => void',
          desc: { 'zh-TW': '累加刮除', en: 'Cumulative scratch' },
        },
        {
          name: 'revealAll',
          signature: '() => void',
          desc: { 'zh-TW': '強制揭曉', en: 'Force reveal' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getProgress',
          signature: '() => number',
          desc: { 'zh-TW': '讀進度', en: 'Read progress' },
        },
      ],
      types: 'interface ScratchCardProps { prize: Prize; revealThreshold?: number; ... }',
    },
  }),
  defineGame({
    id: 'daily-checkin',
    category: 'loyalty',
    icon: '📅',
    accent: 'oklch(0.78 0.18 145)',
    title: { 'zh-TW': '每日簽到', en: 'Daily Check-in' },
    shortDesc: { 'zh-TW': '連續簽到領獎', en: 'Check in daily' },
    longDesc: {
      'zh-TW': '7 日連簽，第 7 日為大獎格。',
      en: '7-day check-in; day 7 is the bonus slot.',
    },
    Component: DailyCheckin,
    defaultProps: {},
    source: { component: dailyCheckinSource, types: dailyCheckinTypes },
    intro: {
      'zh-TW': '每日簽到組件，支援受控 checked 雙模。',
      en: 'Daily check-in with controlled checked mode.',
    },
    install: 'pnpm add @play-kit/games',
    basicUsage: '<DailyCheckin rewards={[5,10,15,20,30,50,100]} />',
    knobs: [{ prop: 'checkDelayMs', type: 'number', min: 0, max: 2000, step: 100, default: 700 }],
    api: {
      props: [
        {
          name: 'rewards',
          type: 'number[]',
          default: '[5,10,15,20,30,50,100]',
          desc: { 'zh-TW': '每日獎勵', en: 'Per-day rewards' },
        },
        {
          name: 'defaultChecked',
          type: 'boolean[]',
          default: '全 false',
          desc: { 'zh-TW': '非受控初始', en: 'Uncontrolled initial' },
        },
        {
          name: 'checked',
          type: 'boolean[]',
          default: '—',
          desc: { 'zh-TW': '受控簽到', en: 'Controlled checked' },
        },
        {
          name: 'onCheckedChange',
          type: '(c) => void',
          default: '—',
          desc: { 'zh-TW': 'checked 變動', en: 'Checked changes' },
        },
        {
          name: 'checkDelayMs',
          type: 'number',
          default: '700',
          desc: { 'zh-TW': '簽到動畫 ms', en: 'Check delay (ms)' },
        },
        ...BASE_PROPS,
      ],
      events: [
        {
          name: 'onCheckIn',
          params: '(day, pts) => void',
          desc: { 'zh-TW': '簽到', en: 'Check in' },
        },
        {
          name: 'onEnd',
          params: '(total) => void',
          desc: { 'zh-TW': '7 日達成', en: 'All 7 days done' },
        },
        { name: 'onWin', params: '(total) => void', desc: { 'zh-TW': '勝利', en: 'Won' } },
        { name: 'onClaim', params: '(total) => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
      ],
      methods: [
        {
          name: 'checkIn',
          signature: '() => void',
          desc: { 'zh-TW': '今日簽到', en: 'Today checked in' },
        },
        { name: 'reset', signature: '() => void', desc: { 'zh-TW': '重置', en: 'Reset' } },
        { name: 'claim', signature: '() => void', desc: { 'zh-TW': '領取', en: 'Claim' } },
        {
          name: 'getState',
          signature: '() => GameState',
          desc: { 'zh-TW': '讀 state', en: 'Read state' },
        },
        {
          name: 'getChecked',
          signature: '() => boolean[]',
          desc: { 'zh-TW': '讀 checked', en: 'Read checked[]' },
        },
        {
          name: 'getTotalPoints',
          signature: '() => number',
          desc: { 'zh-TW': '讀總點', en: 'Read total points' },
        },
      ],
      types: 'interface DailyCheckinProps { rewards?: readonly number[]; ... }',
    },
  }),
];

export const byId = new Map(registry.map((g) => [g.id, g]));
