'use client';
// PlayKitProvider 用 React Context（client-only），整支 'use client' 即可。
// 把它做成獨立 boundary 而不是直接在 layout.tsx 加 'use client'，是 Next.js
// App Router 的最佳實踐 —— 讓 layout 維持 server component 換取更好的串流 / RSC。
import { PlayKitProvider } from '@play-kit/games/i18n';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PlayKitProvider lang="zh-TW" theme="nocturne">
      {children}
    </PlayKitProvider>
  );
}
