import { useMemo, useState } from 'react';
import type { DocsLang } from '../i18n';
import { useDocsStrings } from '../i18n';
import { registry } from '../registry';
import type { GameCategory } from '../registry';

const CATEGORIES: readonly GameCategory[] = ['classic', 'skill', 'loyalty'];

export function Sidebar({ route, lang }: { route: string; lang: DocsLang }) {
  const s = useDocsStrings();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map: Record<GameCategory, typeof registry> = { classic: [], skill: [], loyalty: [] };
    for (const game of registry) {
      if (q) {
        const matchesTitle = game.title[lang].toLowerCase().includes(q);
        const matchesId = game.id.includes(q);
        if (!matchesTitle && !matchesId) continue;
      }
      map[game.category].push(game);
    }
    return map;
  }, [query, lang]);

  return (
    <aside className="docs-sidebar">
      <a className="docs-brand" href="#home">
        <div className="docs-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--pk-accent)" />
            <path
              d="M10 16 L14 20 L22 12"
              stroke="var(--pk-bg-0)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="docs-brand__name">{s.brand}</div>
          <div className="docs-brand__sub">{s.brandSub}</div>
        </div>
      </a>

      <label className="docs-search">
        <span className="docs-sr-only">{s.search}</span>
        <input
          type="search"
          placeholder={s.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {CATEGORIES.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="docs-navgroup">
            <div className="docs-navgroup__label">{s.categories[cat]}</div>
            {items.map((g) => (
              <a
                key={g.id}
                className={`docs-navitem${route === g.id ? ' docs-navitem--active' : ''}`}
                href={`#${g.id}`}
              >
                <span className="docs-navitem__dot" style={{ background: g.accent }} />
                <span>{g.title[lang]}</span>
              </a>
            ))}
          </div>
        );
      })}

      {/* External resources：examples + GitHub */}
      <div className="docs-navgroup">
        <div className="docs-navgroup__label">{s.resources.title}</div>
        <a
          className="docs-navitem docs-navitem--external"
          href="https://github.com/singer0503/play-kit/tree/main/examples"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="docs-navitem__dot" aria-hidden="true">↗</span>
          <span>{s.resources.examples}</span>
        </a>
        <a
          className="docs-navitem docs-navitem--external"
          href="https://github.com/singer0503/play-kit"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="docs-navitem__dot" aria-hidden="true">↗</span>
          <span>{s.resources.github}</span>
        </a>
      </div>

      <div className="docs-sidebar__foot">{s.footer}</div>
    </aside>
  );
}
