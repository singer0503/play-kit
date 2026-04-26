import { useEffect, useState } from 'react';
import { useDocsStrings } from '../i18n';

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

// 掃描 main content 內所有 h2[id] / h3[id]，用 IntersectionObserver 標記當前 section。
// 僅於寬螢幕顯示（由 CSS 控制）。
export function OnThisPage({ scope }: { scope: HTMLElement | null }) {
  const s = useDocsStrings();
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!scope) return;
    const heads = scope.querySelectorAll<HTMLElement>('h2[id], h3[id]');
    setItems(
      Array.from(heads).map((h) => ({
        id: h.id,
        text: h.textContent ?? h.id,
        level: h.tagName === 'H2' ? 2 : 3,
      })),
    );
    if (heads.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0.1 },
    );
    for (const h of heads) io.observe(h);
    return () => io.disconnect();
  }, [scope]);

  if (items.length === 0) return null;

  return (
    <nav className="docs-otp" aria-label={s.labels.onThisPage}>
      <div className="docs-otp__title">{s.labels.onThisPage}</div>
      <ol className="docs-otp__list">
        {items.map((it) => (
          <li
            key={it.id}
            className={`docs-otp__item docs-otp__item--h${it.level}${
              activeId === it.id ? ' docs-otp__item--active' : ''
            }`}
          >
            <a href={`#${it.id}`}>{it.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
