import { Fragment, useRef } from 'react';
import { EventsTable, MethodsTable, PropsTable } from '../docs-ui/ApiTable';
import { CodeBlock } from '../docs-ui/CodeBlock';
import { OnThisPage } from '../docs-ui/OnThisPage';
import { PropsPlayground } from '../docs-ui/PropsPlayground';
import { StateMatrix } from '../docs-ui/StateMatrix';
import type { DocsLang } from '../i18n';
import { useDocsStrings } from '../i18n';
import type { GameMeta } from '../registry';
import { useGamePageState } from './use-game-page-state';

export function GamePage({ game, lang }: { game: GameMeta; lang: DocsLang }) {
  const s = useDocsStrings();
  const { tab, setTab, resetKey, setDemoState, stagedOverrides, reset } = useGamePageState();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="docs-page-wrap">
      <article ref={contentRef} className="docs-page">
        <header className="docs-page__head">
          <div className="docs-page__kicker">{s.categories[game.category]}</div>
          <h1 className="docs-page__title">{game.title[lang]}</h1>
          <p className="docs-page__lead">{game.longDesc[lang]}</p>
        </header>

        <section className="docs-section" id="preview">
          <h2 className="docs-h2">{s.tabs.demo}</h2>
          <div className="docs-tabs">
            <button
              type="button"
              className={tab === 'demo' ? 'docs-tab docs-tab--on' : 'docs-tab'}
              onClick={() => setTab('demo')}
              aria-pressed={tab === 'demo'}
            >
              {s.tabs.demo}
            </button>
            <button
              type="button"
              className={tab === 'code' ? 'docs-tab docs-tab--on' : 'docs-tab'}
              onClick={() => setTab('code')}
              aria-pressed={tab === 'code'}
            >
              {s.tabs.code}
            </button>
            {tab === 'demo' ? (
              <button type="button" className="docs-tab docs-tab--ghost" onClick={reset}>
                {s.labels.reset}
              </button>
            ) : null}
          </div>

          {tab === 'demo' ? (
            <div className="docs-stage">
              <Fragment key={resetKey}>{game.render(stagedOverrides)}</Fragment>
            </div>
          ) : (
            <div className="docs-code-stack">
              <h3 className="docs-h3">{game.id}.tsx</h3>
              <CodeBlock code={game.source.component} lang="tsx" />
              <h3 className="docs-h3">types.ts</h3>
              <CodeBlock code={game.source.types} lang="ts" />
            </div>
          )}
        </section>

        <section className="docs-section" id="state-matrix">
          <StateMatrix render={game.render} onSelect={setDemoState} />
        </section>

        {game.knobs && game.knobs.length > 0 ? (
          <section className="docs-section" id="playground">
            <PropsPlayground
              render={game.render}
              seedProps={game.seedProps}
              knobs={game.knobs}
              resetKey={resetKey}
            />
          </section>
        ) : null}

        <section className="docs-section" id="install">
          <h2 className="docs-h2">{s.labels.install}</h2>
          <CodeBlock code={game.install} lang="bash" />
        </section>

        <section className="docs-section" id="usage">
          <h2 className="docs-h2">{s.labels.usage}</h2>
          <CodeBlock code={game.basicUsage} lang="tsx" />
        </section>

        <section className="docs-section" id="introduction">
          <h2 className="docs-h2">{s.labels.introduction}</h2>
          <p className="docs-section__p">{game.intro[lang]}</p>
        </section>

        <section className="docs-section" id="props">
          <h2 className="docs-h2">{s.labels.props}</h2>
          <PropsTable rows={game.api.props} lang={lang} />
        </section>

        {game.api.events.length > 0 ? (
          <section className="docs-section" id="events">
            <h2 className="docs-h2">{s.labels.events}</h2>
            <EventsTable rows={game.api.events} lang={lang} />
          </section>
        ) : null}

        {game.api.methods.length > 0 ? (
          <section className="docs-section" id="methods">
            <h2 className="docs-h2">{s.labels.methods}</h2>
            <MethodsTable rows={game.api.methods} lang={lang} />
          </section>
        ) : null}

        <section className="docs-section" id="types">
          <h2 className="docs-h2">{s.labels.types}</h2>
          <CodeBlock code={game.api.types} lang="ts" />
        </section>
      </article>
      <OnThisPage scope={contentRef.current} />
    </div>
  );
}
