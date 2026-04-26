import { createContext, useContext } from 'react';
import type { DocsStrings } from './en';
import { en } from './en';
import { zhTW } from './zh-TW';

export type DocsLang = 'zh-TW' | 'en';

export const docsDicts: Record<DocsLang, DocsStrings> = {
  'zh-TW': zhTW,
  en,
};

export const DocsLangContext = createContext<DocsLang>('zh-TW');

export function useDocsLang(): DocsLang {
  return useContext(DocsLangContext);
}

export function useDocsStrings(): DocsStrings {
  return docsDicts[useDocsLang()];
}

export type { DocsStrings };
