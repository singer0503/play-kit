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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  // 切 game / 切 home 時自動關 mobile drawer
  // biome-ignore lint/correctness/useExhaustiveDependencies: 故意在 route 變化時 retrigger，effect 本身不讀 route
  useEffect(() => {
    setSidebarOpen(false);
  }, [route]);
  // 切 game 時滾回頁面頂端，使用者才看得到預覽（而不是停留在前一頁底部的 props/events 表）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 故意在 route 變化時 retrigger
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route]);
  // ESC 關閉 mobile drawer
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);
  // body scroll lock when drawer open
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const game = byId.get(route);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <DocsLangContext.Provider value={lang}>
      <PlayKitProvider lang={lang}>
        <div className={`docs-shell${sidebarOpen ? ' docs-shell--open' : ''}`}>
          <Sidebar route={route} lang={lang} />
          {sidebarOpen ? (
            <button
              type="button"
              className="docs-shell__backdrop"
              aria-label="Close menu"
              onClick={closeSidebar}
            />
          ) : null}
          <div className="docs-main">
            <TopBar
              theme={theme}
              onThemeChange={setTheme}
              lang={lang}
              onLangChange={setLang}
              route={route}
              onMenuToggle={() => setSidebarOpen((v) => !v)}
            />
            <main className="docs-main__scroll">
              {game ? <GamePage key={game.id} game={game} lang={lang} /> : <Home lang={lang} />}
            </main>
          </div>
        </div>
      </PlayKitProvider>
    </DocsLangContext.Provider>
  );
}
