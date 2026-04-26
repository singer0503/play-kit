/**
 * check:ssr — 對每個 game 跑 renderToString，捕捉任何 SSR-unsafe 呼叫
 * （window / document / navigator / localStorage / Canvas / DeviceMotion 等）。
 *
 * 失敗條件：renderToString 擲錯；或 console.error/warn 有輸出。
 * 成功條件：17 款全數渲染無誤。
 */
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

// 直接從 source import（不經 dist；保證跑到的是本地 WIP）
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
  PlayKitProvider,
  Quiz,
  RingToss,
  ScratchCard,
  Shake,
  ShakeDice,
  SlotMachine,
  SmashEgg,
} from '../src/index.ts';

type AnyComponent = Parameters<typeof createElement>[0];
interface Case {
  id: string;
  Component: AnyComponent;
  // biome-ignore lint/suspicious/noExplicitAny: 每款 demo props 型別各異；runtime 只 SSR render 不做 type check
  props: Record<string, any>;
}

const cases: Case[] = [
  {
    id: 'lucky-wheel',
    Component: LuckyWheel,
    props: {
      prizes: [
        { id: 'p1', label: '$10', win: true, color: '#f43f5e' },
        { id: 'p2', label: 'Miss', win: false, color: '#444' },
      ],
    },
  },
  {
    id: 'nine-grid',
    Component: NineGrid,
    props: {
      cells: Array.from({ length: 8 }, (_, i) => ({
        id: `c${i}`,
        label: `$${i}`,
        win: i % 2 === 0,
      })),
    },
  },
  {
    id: 'marquee',
    Component: Marquee,
    props: {
      prizes: Array.from({ length: 6 }, (_, i) => ({
        id: `m${i}`,
        label: `$${i}`,
        win: i % 2 === 0,
      })),
    },
  },
  {
    id: 'smash-egg',
    Component: SmashEgg,
    props: {
      eggs: [
        { id: 'e1', label: '$1', win: true },
        { id: 'e2', label: 'Miss', win: false },
      ],
    },
  },
  {
    id: 'gift-box',
    Component: GiftBox,
    props: {
      boxes: [
        { id: 'b1', label: '$1', win: true },
        { id: 'b2', label: 'Miss', win: false },
      ],
    },
  },
  {
    id: 'scratch-card',
    Component: ScratchCard,
    props: { prize: { id: 'p', label: '$100', win: true } },
  },
  {
    id: 'slot-machine',
    Component: SlotMachine,
    props: {},
  },
  {
    id: 'flip-match',
    Component: FlipMatch,
    props: {},
  },
  {
    id: 'quiz',
    Component: Quiz,
    props: {
      questions: [
        {
          q: 'test?',
          opts: ['a', 'b', 'c', 'd'],
          ans: 0,
        },
      ],
    },
  },
  {
    id: 'shake-dice',
    Component: ShakeDice,
    props: {},
  },
  {
    id: 'lotto-roll',
    Component: LottoRoll,
    props: {},
  },
  {
    id: 'ring-toss',
    Component: RingToss,
    props: {},
  },
  {
    id: 'shake',
    Component: Shake,
    props: {},
  },
  {
    id: 'gift-rain',
    Component: GiftRain,
    props: {},
  },
  {
    id: 'doll-machine',
    Component: DollMachine,
    props: {
      plushes: [
        { id: 'd1', label: 'Teddy', win: true },
        { id: 'd2', label: 'Cat', win: true },
      ],
    },
  },
  {
    id: 'guess-gift',
    Component: GuessGift,
    props: {},
  },
  {
    id: 'daily-checkin',
    Component: DailyCheckin,
    props: {},
  },
];

const errs: { id: string; kind: 'throw' | 'console'; msg: string }[] = [];

// 攔 console.error / console.warn — SSR 路徑的 React warning 也要算失敗
const origError = console.error;
const origWarn = console.warn;
let currentId = '';
console.error = (...args: unknown[]) => {
  errs.push({ id: currentId, kind: 'console', msg: `error: ${args.map(String).join(' ')}` });
  origError(...args);
};
console.warn = (...args: unknown[]) => {
  errs.push({ id: currentId, kind: 'console', msg: `warn: ${args.map(String).join(' ')}` });
  origWarn(...args);
};

for (const c of cases) {
  currentId = c.id;
  try {
    const el = createElement(PlayKitProvider, { lang: 'en' }, createElement(c.Component, c.props));
    const html = renderToString(el);
    if (!html || html.length < 5) {
      errs.push({ id: c.id, kind: 'throw', msg: 'empty render output' });
    }
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e);
    errs.push({ id: c.id, kind: 'throw', msg });
  }
}

console.error = origError;
console.warn = origWarn;

if (errs.length > 0) {
  console.error(`\n[check:ssr] ✗ ${errs.length} 個 SSR 問題：\n`);
  for (const e of errs) {
    console.error(`  [${e.id}] ${e.kind}: ${e.msg}`);
  }
  process.exit(1);
}

console.log(`[check:ssr] ✓ ${cases.length} 款 game 全數 SSR-safe`);
