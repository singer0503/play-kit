import { createContext, useContext, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { ThemeName } from '../theme/tokens';
import { en } from './en';
import type { I18nKey } from './en';
import { zhTW } from './zh-TW';

export type Lang = 'zh-TW' | 'en';

export type TranslateFn = (
  key: I18nKey | (string & {}),
  params?: Record<string, string | number>,
) => string;

export interface I18nContextValue {
  lang: Lang;
  t: TranslateFn;
}

const DICTS: Record<Lang, Record<string, string>> = {
  'zh-TW': zhTW,
  en,
};

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * 縮放政策：
 * - `'auto'`（預設）：每款 game 內部用 `useGameScale` + ResizeObserver 在窄容器自動等比縮放
 * - `'off'`：embedder 想保證 game 維持設計尺寸時關閉，hook 變 no-op
 */
export type ScalePolicy = 'auto' | 'off';
const ScalePolicyContext = createContext<ScalePolicy>('auto');

export interface PlayKitProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** 語系；預設 'zh-TW'。若未傳，內部 game 仍可呼叫 useI18n() */
  lang?: Lang;
  /** 主題；會設 `data-theme` 到 provider root div，讓 tokens.css 生效 */
  theme?: ThemeName;
  /**
   * 響應式縮放政策。預設 `'auto'`：
   * - `'auto'`：game 在窄容器自動等比縮（containerWidth < designWidth）
   * - `'off'`：完全關閉縮放，game 維持設計尺寸（embedder 自管 layout）
   */
  scale?: ScalePolicy;
  /**
   * 當設定 `theme` 時，預設會輸出一個 `<div data-theme>` 作為主題邊界。
   * 若呼叫端已在外層自己設 `<html data-theme>`，可傳 false 跳過 wrapper。
   */
  wrap?: boolean;
  children: ReactNode;
}

/**
 * 組件庫根 provider：
 * - 語系（`lang`）— 所有 game 透過 `useI18n()` 讀取
 * - 主題（`theme`）— 設 `data-theme` 到 wrapper div，tokens.css 自動切 palette
 * - 任何 HTML attribute（`className` / `style` / `data-*` / `id` / `role` ...）
 *   都會透傳到 wrapper div；方便外部控制 layout 或注入 test id
 *
 * 未包 provider 時，game 仍可運作（fallback 到英文 + 預設 nocturne theme）。
 */
export function PlayKitProvider({
  lang,
  theme,
  scale,
  wrap,
  children,
  className,
  ...rest
}: PlayKitProviderProps) {
  // 巢狀 Provider 友善：未指定 prop 時繼承外層 context（最終 fallback 才預設）。
  // 用途：StateMatrix 等 thumbnail 場景包一層 `<PlayKitProvider scale="off">`
  // 想關閉縮放、但保留外層的 lang / theme。
  const outerI18n = useContext(I18nContext);
  const outerScale = useContext(ScalePolicyContext);
  const effectiveLang: Lang = lang ?? outerI18n?.lang ?? 'zh-TW';
  const effectiveScale: ScalePolicy = scale ?? outerScale ?? 'auto';

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[effectiveLang] ?? en;
    const t: TranslateFn = (key, params) => {
      const raw = dict[key] ?? (en as Record<string, string>)[key] ?? key;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_match, k: string) =>
        k in params ? String(params[k]) : `{${k}}`,
      );
    };
    return { lang: effectiveLang, t };
  }, [effectiveLang]);

  const node = (
    <ScalePolicyContext.Provider value={effectiveScale}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </ScalePolicyContext.Provider>
  );

  // 預設行為：有傳 theme 才 wrap；顯式傳 wrap=true 也 wrap（方便注入 className / data-*）
  const shouldWrap = wrap ?? theme !== undefined;
  if (!shouldWrap) return node;

  return (
    <div data-theme={theme} className={['pk-root', className].filter(Boolean).join(' ')} {...rest}>
      {node}
    </div>
  );
}

// fallback：未包 provider 時回傳英文字典
const FALLBACK: I18nContextValue = {
  lang: 'en',
  t: (key, params) => {
    const raw = (en as Record<string, string>)[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_m, k: string) =>
      k in params ? String(params[k]) : `{${k}}`,
    );
  },
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? FALLBACK;
}

/**
 * 讀取目前的縮放政策。未包 PlayKitProvider 時 fallback 為 'auto'。
 *
 * 各 game 在組件內這樣用：
 * ```tsx
 * const policy = useScalePolicy();
 * const scaleRef = useGameScale(340, { enabled: policy === 'auto' });
 * ```
 */
export function useScalePolicy(): ScalePolicy {
  return useContext(ScalePolicyContext);
}
