import { useEffect, useState } from 'react';
import { cn } from '@/kvant';
import { highlight, type CodeLang } from '../lib/highlight';
import { CopyButton } from './CopyButton';

export interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
  /** File name or caption in the header. */
  title?: string;
  /** Caps the height; the block scrolls inside. */
  maxHeight?: number;
  /** No own frame: for code that sits inside another card. */
  flush?: boolean;
  className?: string;
}

export function CodeBlock({ code, lang = 'tsx', title, maxHeight, flush = false, className }: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null);

  useEffect(() => {
    let current = true;
    highlight(code, lang).then(
      (html) => {
        if (current) setHighlighted({ code, html });
      },
      // plain text stays on screen if highlighting fails
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [code, lang]);

  const html = highlighted?.code === code ? highlighted.html : null;

  return (
    <div
      data-slot="code-block"
      className={cn('docs-code overflow-hidden bg-surface-1', flush ? 'border-t border-separator' : 'rounded-xl shadow-raised', className)}
    >
      <div className="flex h-11 items-center gap-3 border-b border-separator pr-2 pl-5">
        <span className="min-w-0 flex-1 truncate font-mono text-caption text-fg-3">{title ?? (lang === 'bash' ? 'Терминал' : lang)}</span>
        <CopyButton value={code} label="Скопировать код" />
      </div>
      <div className="overflow-y-auto" style={maxHeight ? { maxHeight } : undefined}>
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre tabIndex={0}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
