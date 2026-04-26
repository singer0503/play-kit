import type { Lang, ThemeName } from '@play-kit/games';
import { PlayKitProvider } from '@play-kit/games/i18n';
// Sub-path imports — bundler 只把這兩款 game + Provider 拉進去（gzip ≈ 8 KB）
import { LuckyWheel, type LuckyWheelPrize } from '@play-kit/games/lucky-wheel';
import { ScratchCard } from '@play-kit/games/scratch-card';
import { useState } from 'react';

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

const card = { label: '$200', win: true } as const;

export function App() {
  const [lang, setLang] = useState<Lang>('zh-TW');
  const [theme, setTheme] = useState<ThemeName>('nocturne');

  return (
    <PlayKitProvider lang={lang} theme={theme}>
      <main style={{ padding: 24, maxWidth: 720, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1>Play Kit · Vite example</h1>

        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <button type="button" onClick={() => setLang(lang === 'zh-TW' ? 'en' : 'zh-TW')}>
            Lang: {lang}
          </button>
          <button
            type="button"
            onClick={() => {
              const next: ThemeName[] = ['nocturne', 'light', 'neon', 'holo'];
              setTheme(next[(next.indexOf(theme) + 1) % next.length] ?? 'nocturne');
            }}
          >
            Theme: {theme}
          </button>
        </div>

        <h2>LuckyWheel</h2>
        <LuckyWheel
          prizes={prizes}
          maxPlays={3}
          onWin={(prize) => console.log('won', prize)}
          onEnd={(prize, idx) => console.log('landed', prize, idx)}
        />

        <h2 style={{ marginTop: 32 }}>ScratchCard</h2>
        <ScratchCard prize={card} onReveal={(p) => console.log('revealed', p)} />
      </main>
    </PlayKitProvider>
  );
}
