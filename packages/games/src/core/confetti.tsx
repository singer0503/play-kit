import { useMemo } from 'react';
import { cx } from './cx';
import { useReducedMotion } from './use-reduced-motion';

const DEFAULT_COLORS = [
  'oklch(0.82 0.14 82)',
  'oklch(0.72 0.22 25)',
  'oklch(0.58 0.23 310)',
  'oklch(0.68 0.14 200)',
  'oklch(0.95 0.06 82)',
];

export interface ConfettiProps {
  /** 彩色紙片數量，預設 60 */
  count?: number;
  /** 調色盤 */
  colors?: readonly string[];
  /** 外部 className */
  className?: string;
}

// 勝利慶祝彩帶。prefers-reduced-motion 時不渲染（由 hook 自行判斷）。
export function Confetti({ count = 60, colors = DEFAULT_COLORS, className }: ConfettiProps) {
  const reducedMotion = useReducedMotion();

  // 隨機種子在 memo 裡只算一次，避免 render 抖動
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_unused, i) => ({
        key: i,
        left: Math.random() * 100,
        color: colors[i % colors.length] ?? colors[0] ?? DEFAULT_COLORS[0],
        delay: Math.random() * 0.4,
        duration: 2 + Math.random() * 1.6,
        rotate: Math.random() * 360,
      })),
    [count, colors],
  );

  if (reducedMotion) return null;

  return (
    <div className={cx('pk-confetti', className)} aria-hidden="true" role="presentation">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="pk-confetti__piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
