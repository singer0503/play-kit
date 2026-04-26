import { PlayKitProvider } from '@play-kit/games';
import { useEffect, useRef, useState } from 'react';
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
  // 切 game 時 scroll-to-top 的 pending 旗標。route 變動時 set true、
  // 真的執行完 scroll 後 clear。
  const pendingScrollRef = useRef(false);

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
  // 切 game / 切 home 時自動關 mobile drawer + 標記 scroll pending
  // biome-ignore lint/correctness/useExhaustiveDependencies: 故意在 route 變化時 retrigger
  useEffect(() => {
    setSidebarOpen(false);
    pendingScrollRef.current = true;
  }, [route]);
  // 等 drawer 真的關閉、body overflow 解鎖後，再 scroll 回頁頂。
  // 直接在 route 變化時 scroll 會被 body overflow:hidden 擋住失效（mobile drawer 場景），
  // 故拆成兩 effect：先關 drawer + 設 pending（上面那個），這個 effect 等
  // sidebarOpen → false 後檢查 pending、執行 scroll、清旗標。
  // 桌機 sidebar 永遠 false，pending 設了之後此 effect 立即觸發、scroll 馬上執行。
  // biome-ignore lint/correctness/useExhaustiveDependencies: route 列入 dep 確保桌機切 game（sidebarOpen 不變）也會 retrigger 此 effect
  useEffect(() => {
    if (sidebarOpen || !pendingScrollRef.current) return;
    if (typeof window === 'undefined') return;
    pendingScrollRef.current = false;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route, sidebarOpen]);
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
