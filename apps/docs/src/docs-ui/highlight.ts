import type { Highlighter } from 'shiki';

// Shiki highlighter 採模組級 singleton；只會載入一次 wasm
let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(async ({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: ['tsx', 'ts', 'bash', 'json', 'css'],
      }),
    );
  }
  return highlighterPromise;
}

export type SupportedLang = 'tsx' | 'ts' | 'bash' | 'json' | 'css';

export async function highlight(code: string, lang: SupportedLang, dark: boolean): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code, {
    lang,
    theme: dark ? 'github-dark' : 'github-light',
  });
}
