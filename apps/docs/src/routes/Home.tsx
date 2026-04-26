import type { DocsLang } from '../i18n';
import { useDocsStrings } from '../i18n';
import { registry } from '../registry';

export function Home({ lang }: { lang: DocsLang }) {
  const s = useDocsStrings();
  return (
    <div className="docs-home">
      <section className="docs-hero">
        <div className="docs-hero__kicker">{s.home.kicker}</div>
        <h1 className="docs-hero__title">{s.home.title}</h1>
        <p className="docs-hero__lead">{s.home.lead}</p>
        <div className="docs-hero__actions">
          {registry[0] ? (
            <a href={`#${registry[0].id}`} className="docs-btn docs-btn--primary">
              {s.home.browse} →
            </a>
          ) : null}
        </div>
        <div className="docs-hero__stats">
          <div>
            <b>{registry.length}</b>
            <span>{s.home.stats.games}</span>
          </div>
          <div>
            <b>6</b>
            <span>{s.home.stats.states}</span>
          </div>
          <div>
            <b>0</b>
            <span>{s.home.stats.deps}</span>
          </div>
        </div>
      </section>

      <section className="docs-grid" id="games-grid">
        <div className="docs-grid__cards">
          {registry.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="docs-card"
              style={{ ['--card-accent' as string]: g.accent }}
            >
              <div className="docs-card__art" aria-hidden="true">
                {g.icon}
              </div>
              <div className="docs-card__title">{g.title[lang]}</div>
              <div className="docs-card__desc">{g.shortDesc[lang]}</div>
              <div className="docs-card__foot">
                <span className="docs-card__cat">{s.categories[g.category]}</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
