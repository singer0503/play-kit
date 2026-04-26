import { PlayKitProvider } from '@play-kit/games';
import { useEffect, useState } from 'react';
import { DocsLangContext } from './i18n';
import type { DocsLang } from './i18n';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import type { ThemeName } from './layout/TopBar';
import { byId } from './registry';
import { GamePage } from './routes/GamePage';
import { Home } from './routes/Home';

const LS_THEME = 'pk.docs.theme';
const LS_LANG = 'pk.docs.lang';

function readTheme(): ThemeName {
  if (typeof window === 'undefined') return 'nocturne';
  const raw = localStorage.getItem(LS_THEME);
  if (raw === 'light' || raw === 'neon' || raw === 'holo') return raw;
  return 'nocturne';
}
function readLang(): DocsLang {
  if (typeof window === 'undefined') return 'zh-TW';
  return localStorage.getItem(LS_LANG) === 'en' ? 'en' : 'zh-TW';
}

function readRoute(): string {
  if (typeof window === 'undefined') return 'home';
  return window.location.hash.slice(1) || 'home';
}

export function App() {
  const [theme, setTheme] = useState<ThemeName>(readTheme);
  const [lang, setLang] = useState<DocsLang>(readLang);
  const [route, setRoute] = useState<string>(readRoute);

  // theme → <html data-theme> + persist
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);
  // lang → <html lang> + persist
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LS_LANG, lang);
  }, [lang]);
  // hashchange → route
  useEffect(() => {
    const handler = () => setRoute(readRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const game = byId.get(route);

  return (
    <DocsLangContext.Provider value={lang}>
      <PlayKitProvider lang={lang}>
        <div className="docs-shell">
          <Sidebar route={route} lang={lang} />
          <div className="docs-main">
            <TopBar
              theme={theme}
              onThemeChange={setTheme}
              lang={lang}
              onLangChange={setLang}
              route={route}
            />
            <main className="docs-main__scroll">
              {game ? <GamePage game={game} lang={lang} /> : <Home lang={lang} />}
            </main>
          </div>
        </div>
      </PlayKitProvider>
    </DocsLangContext.Provider>
  );
}
