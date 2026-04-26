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

export interface PlayKitProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** 語系；預設 'zh-TW'。若未傳，內部 game 仍可呼叫 useI18n() */
  lang?: Lang;
  /** 主題；會設 `data-theme` 到 provider root div，讓 tokens.css 生效 */
  theme?: ThemeName;
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
  lang = 'zh-TW',
  theme,
  wrap,
  children,
  className,
  ...rest
}: PlayKitProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[lang] ?? en;
    const t: TranslateFn = (key, params) => {
      const raw = dict[key] ?? (en as Record<string, string>)[key] ?? key;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_match, k: string) =>
        k in params ? String(params[k]) : `{${k}}`,
      );
    };
    return { lang, t };
  }, [lang]);

  const node = <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;

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
