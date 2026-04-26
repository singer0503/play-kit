// 對應 tokens.css 的 TS export；僅給 JS 需要動態讀 token 時使用
// （例：canvas 繪製時取 theme 色）。
// 名稱格式：theme.key → 'var(--pk-key)'。
export const themes = ['nocturne', 'light', 'neon', 'holo'] as const;
export type ThemeName = (typeof themes)[number];

export const tokens = {
  bg0: 'var(--pk-bg-0)',
  bg1: 'var(--pk-bg-1)',
  bg2: 'var(--pk-bg-2)',
  bgInk: 'var(--pk-bg-ink)',
  fg0: 'var(--pk-fg-0)',
  fg1: 'var(--pk-fg-1)',
  fg2: 'var(--pk-fg-2)',
  border: 'var(--pk-border)',
  borderStrong: 'var(--pk-border-strong)',
  accent: 'var(--pk-accent)',
  accent2: 'var(--pk-accent-2)',
  accent3: 'var(--pk-accent-3)',
  accentFg: 'var(--pk-accent-fg)',
  win: 'var(--pk-win)',
  lose: 'var(--pk-lose)',
  durationFast: 'var(--pk-duration-fast)',
  durationMed: 'var(--pk-duration-med)',
  durationSlow: 'var(--pk-duration-slow)',
  easeOut: 'var(--pk-ease-out)',
} as const;

export type TokenName = keyof typeof tokens;
