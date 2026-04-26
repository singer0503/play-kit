import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';

// Server component — 整套樣式在 root layout 一次 import
import '@play-kit/games/styles.css';

export const metadata: Metadata = {
  title: '@play-kit/games — Next.js App Router example',
  description: 'Tree-shakable React mini-game kit, with PlayKitProvider on the client boundary.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, fontFamily: 'system-ui' }}>
        {/* Providers 包進 'use client' boundary，root layout 仍是 server component */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
