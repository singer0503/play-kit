'use client';
// Client island — game 互動需要 useState / useRef / DOM events，必須 'use client'.
import { LuckyWheel, type LuckyWheelPrize } from '@play-kit/games/lucky-wheel';

const prizes: LuckyWheelPrize[] = [
  { label: '$100', win: true, weight: 1 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$50', win: true, weight: 2 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$20', win: true, weight: 3 },
  { label: 'Miss', win: false, weight: 4 },
  { label: '$10', win: true, weight: 4 },
  { label: 'Miss', win: false, weight: 4 },
];

export function GameSection() {
  return (
    <section style={{ marginTop: 16 }}>
      <h2>LuckyWheel</h2>
      <LuckyWheel prizes={prizes} maxPlays={3} onWin={(prize) => console.log('won', prize)} />
    </section>
  );
}
