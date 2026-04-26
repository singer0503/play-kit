import { useEffect, useState } from 'react';
import { useDocsStrings } from '../i18n';
import { type SupportedLang, highlight } from './highlight';

export interface CodeBlockProps {
  code: string;
  lang?: SupportedLang;
  /** 覆寫自動偵測的暗色模式；不傳則跟隨 [data-theme] */
  dark?: boolean;
}

function detectDark(): boolean {
  if (typeof document === 'undefined') return true;
  const t = document.documentElement.dataset.theme;
  return t !== 'light';
}

export function CodeBlock({ code, lang = 'tsx', dark }: CodeBlockProps) {
  const strings = useDocsStrings();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    highlight(code, lang, dark ?? detectDark()).then((h) => {
      if (alive) setHtml(h);
    });
    return () => {
      alive = false;
    };
  }, [code, lang, dark]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard 不可用時忽略（例：非 HTTPS 本地環境）
    }
  }

  return (
    <div className="docs-code">
      <button type="button" className="docs-code__copy" onClick={onCopy}>
        {copied ? strings.labels.copied : strings.labels.copy}
      </button>
      {html ? (
        <div
          className="docs-code__shiki"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki 的 HTML output 為可信
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="docs-code__plain">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
