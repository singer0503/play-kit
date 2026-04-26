// 所有 game 測試共用的 wrapper / mock helper。
// 各 game 的 __tests__/test-utils.tsx 只需要定義自己的 demo data（prize 陣列等）。

import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { Lang } from './i18n/provider';
import { PlayKitProvider } from './i18n/provider';

export function makeWrapper(lang: Lang = 'en') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PlayKitProvider lang={lang}>{children}</PlayKitProvider>;
  };
}

export function stubMatchMedia(reducedMotion = false): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  });
}
