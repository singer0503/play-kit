import type { DocsLang } from '../i18n';
import { useDocsStrings } from '../i18n';
import { byId } from '../registry';

export type ThemeName = 'nocturne' | 'light' | 'neon' | 'holo';
const THEMES: readonly { key: ThemeName; label: string }[] = [
  { key: 'nocturne', label: 'N' },
  { key: 'neon', label: '◉' },
  { key: 'holo', label: '✦' },
  { key: 'light', label: '☀' },
];

export interface TopBarProps {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  lang: DocsLang;
  onLangChange: (lang: DocsLang) => void;
  route: string;
  /** mobile 漢堡按鈕點擊；desktop 不會顯示按鈕，這個 callback 也不會被呼叫 */
  onMenuToggle?: () => void;
}

export function TopBar({
  theme,
  onThemeChange,
  lang,
  onLangChange,
  route,
  onMenuToggle,
}: TopBarProps) {
  const s = useDocsStrings();
  const game = byId.get(route);
  return (
    <header className="docs-topbar">
      <div className="docs-topbar__lead">
        {onMenuToggle ? (
          <button
            type="button"
            className="docs-topbar__menu"
            onClick={onMenuToggle}
            aria-label={s.labels.menu}
          >
            <span aria-hidden="true">☰</span>
          </button>
        ) : null}
        <div className="docs-crumbs">
          <span className="docs-crumbs__muted">{game ? s.categories[game.category] : s.brand}</span>
          {game ? (
            <>
              <span className="docs-crumbs__sep">/</span>
              <span>{game.title[lang]}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="docs-topbar__actions">
        <fieldset className="docs-seg" aria-label={s.labels.lang}>
          <button
            type="button"
            className={lang === 'zh-TW' ? 'docs-seg__on' : ''}
            onClick={() => onLangChange('zh-TW')}
            aria-pressed={lang === 'zh-TW'}
          >
            中
          </button>
          <button
            type="button"
            className={lang === 'en' ? 'docs-seg__on' : ''}
            onClick={() => onLangChange('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
        </fieldset>
        <fieldset className="docs-seg" aria-label={s.labels.theme}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={theme === t.key ? 'docs-seg__on' : ''}
              onClick={() => onThemeChange(t.key)}
              title={t.key}
              aria-pressed={theme === t.key}
              aria-label={`${s.labels.theme}: ${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </fieldset>
      </div>
    </header>
  );
}
