import type { DocsLang } from '../i18n';

// 可本地化的文字：string 或 { 'zh-TW', en } 物件。
type LocalizableText = string | { 'zh-TW': string; en: string };

export interface ApiPropRow {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  desc?: LocalizableText;
}

export interface ApiEventRow {
  name: string;
  params: string;
  desc?: LocalizableText;
}

export interface ApiMethodRow {
  name: string;
  signature: string;
  desc?: LocalizableText;
}

function resolve(txt: LocalizableText | undefined, lang: DocsLang): string {
  if (!txt) return '—';
  if (typeof txt === 'string') return txt;
  return txt[lang] ?? txt.en;
}

export function PropsTable({ rows, lang }: { rows: readonly ApiPropRow[]; lang: DocsLang }) {
  return (
    <div className="docs-api">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
                {r.required ? <sup className="docs-api__req">*</sup> : null}
              </td>
              <td>
                <code>{r.type}</code>
              </td>
              <td>
                <code>{r.default ?? '—'}</code>
              </td>
              <td>{resolve(r.desc, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EventsTable({ rows, lang }: { rows: readonly ApiEventRow[]; lang: DocsLang }) {
  return (
    <div className="docs-api">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Params</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
              </td>
              <td>
                <code>{r.params}</code>
              </td>
              <td>{resolve(r.desc, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MethodsTable({ rows, lang }: { rows: readonly ApiMethodRow[]; lang: DocsLang }) {
  return (
    <div className="docs-api">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
              </td>
              <td>
                <code>{r.signature}</code>
              </td>
              <td>{resolve(r.desc, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
