import { Tabs } from '@base-ui/react/tabs';
import { Check, Copy, File } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useCopy } from '../lib/use-copy';

export type CodeLanguage = 'ts' | 'js' | 'json' | 'bash' | 'text';
export type CodeTokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'type' | 'comment';

export interface CodeToken {
  kind: CodeTokenKind;
  text: string;
}

const KEYWORDS =
  'import|export|from|const|let|var|function|return|async|await|new|if|else|for|while|do|of|in|class|extends|implements|interface|type|enum|as|default|try|catch|finally|throw|this|null|undefined|true|false|typeof|instanceof|switch|case|break|continue|yield|delete|void';
const TYPES = 'string|number|boolean|unknown|never|bigint|symbol|object|any';

// One pass, first match wins: comments, strings, numbers, built-in types, keywords.
const SCRIPT = new RegExp(
  String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|` +
    '`(?:\\\\.|[^`\\\\])*`' +
    String.raw`)|\b(\d[\d_]*(?:\.\d+)?)\b|\b(${TYPES})\b|\b(${KEYWORDS})\b`,
  'g',
);
const SHELL = /((?:^|(?<=\s))#[^\n]*)|("(?:\\.|[^"\\\n])*"|'[^'\n]*')|\b(\d+)\b|((?!))|\b(sudo|cd|export|echo|if|then|fi|for|do|done)\b/g;
const KINDS: readonly CodeTokenKind[] = ['comment', 'string', 'number', 'type', 'keyword'];

/** Splits code into coloured tokens; joined back they give the input exactly. */
export function tokenizeCode(code: string, language: CodeLanguage = 'ts'): CodeToken[] {
  if (language === 'text') return [{ kind: 'plain', text: code }];
  const pattern = language === 'bash' ? SHELL : SCRIPT;
  const tokens: CodeToken[] = [];
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    const index = match.index;
    if (index > last) tokens.push({ kind: 'plain', text: code.slice(last, index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    tokens.push({ kind: KINDS[group] ?? 'plain', text: match[0] });
    last = index + match[0].length;
  }
  if (last < code.length) tokens.push({ kind: 'plain', text: code.slice(last) });
  return tokens;
}

/** Tokens per line, for line numbers and highlighted lines. */
function toLines(tokens: readonly CodeToken[]): CodeToken[][] {
  const lines: CodeToken[][] = [[]];
  for (const token of tokens) {
    token.text.split('\n').forEach((text, index) => {
      if (index > 0) lines.push([]);
      if (text) lines[lines.length - 1]?.push({ kind: token.kind, text });
    });
  }
  return lines;
}

const tokenColors: Record<CodeTokenKind, string> = {
  plain: '',
  keyword: 'text-accent-soft-fg',
  string: 'text-success-soft-fg',
  number: 'text-warning-soft-fg',
  type: 'text-warning-soft-fg',
  comment: 'text-fg-3 italic',
};

const LANGUAGE_NAMES: Record<CodeLanguage, string> = { ts: 'TypeScript', js: 'JavaScript', json: 'JSON', bash: 'Shell', text: '' };

function languageOf(file: CodeFile): CodeLanguage {
  if (file.language) return file.language;
  const extension = file.name?.split('.').pop() ?? '';
  if (['ts', 'tsx', 'mts'].includes(extension)) return 'ts';
  if (['js', 'jsx', 'mjs', 'cjs'].includes(extension)) return 'js';
  if (extension === 'json') return 'json';
  if (['sh', 'bash', 'zsh'].includes(extension)) return 'bash';
  return 'text';
}

/** 28px copy button: icon → check (scale .8 → 1, 150ms), «Скопировано» above it for 2 s. */
function CopyCode({ value, label }: { value: string; label: string }) {
  const [copied, copy] = useCopy();
  return (
    <span className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        onClick={() => copy(value)}
        className="kv-pressable grid size-7 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
      >
        {copied ? (
          <Check aria-hidden className="text-success-soft-fg transition-[scale,opacity] duration-(--duration-quick) ease-out starting:scale-80 starting:opacity-0" />
        ) : (
          <Copy aria-hidden />
        )}
      </button>
      <span
        role="status"
        className={cn(
          copied
            ? 'absolute right-0 bottom-full mb-1.5 rounded-full bg-fg-1 px-2.5 py-1.5 text-caption font-medium whitespace-nowrap text-surface-1 shadow-tooltip transition-[opacity,scale] duration-(--duration-quick) ease-out starting:scale-(--scale-tooltip) starting:opacity-0'
            : 'sr-only',
        )}
      >
        {copied ? 'Скопировано' : ''}
      </span>
    </span>
  );
}

function CodeLines({ code, language, highlight, lineNumbers }: { code: string; language: CodeLanguage; highlight: ReadonlySet<number>; lineNumbers: boolean }) {
  return (
    <pre className="overflow-x-auto py-3 font-mono text-[13px]/[22px] text-fg-1 [tab-size:2]">
      <code className="grid min-w-max">
        {toLines(tokenizeCode(code, language)).map((tokens, index) => (
          <span key={index} data-highlighted={highlight.has(index + 1) || undefined} className="flex min-h-5.5 pr-5 data-highlighted:bg-accent-soft">
            <span aria-hidden className={cn('shrink-0 select-none text-right text-fg-4', lineNumbers ? 'w-12 pr-4' : 'w-5')}>
              {lineNumbers ? index + 1 : null}
            </span>
            <span>
              {tokens.map((token, at) => (
                <span key={at} className={tokenColors[token.kind]}>
                  {token.text}
                </span>
              ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

export interface CodeFile {
  /** File name: a tab when there are several files; its extension picks the language. */
  name?: string;
  code: string;
  language?: CodeLanguage;
}

export interface CodeBlockProps extends Omit<ComponentProps<'div'>, 'children'> {
  files: readonly CodeFile[];
  /** 1-based line numbers to highlight, e.g. [6, 7, 8, 9]. */
  highlight?: readonly number[];
  lineNumbers?: boolean;
}

/**
 * Code on surface-1 r20: file tabs, language and one-click copy in a 44 header; JetBrains Mono 13/22.
 * Highlighting uses three status hues; everything else stays text colour.
 */
export function CodeBlock({ files, highlight = [], lineNumbers = true, className, ...props }: CodeBlockProps) {
  const [active, setActive] = useState(0);
  const current = files[active] ?? files[0];
  const marked = new Set(highlight);
  if (!current) return null;
  const language = languageOf(current);

  const header = (tabs: boolean) => (
    <div className="flex h-11 items-center gap-2 border-b border-separator pr-2 pl-2">
      {tabs ? (
        <Tabs.List aria-label="Файлы" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {files.map((file, index) => (
            <Tabs.Tab
              key={index}
              value={index}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-label-sm font-medium text-fg-2 hover:text-fg-1 data-active:bg-fill-2 data-active:text-fg-1 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]"
            >
              <File aria-hidden />
              {file.name ?? `Файл ${index + 1}`}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      ) : (
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate pl-2.5 text-label-sm font-medium text-fg-2 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]">
          {current.name ? (
            <>
              <File aria-hidden />
              {current.name}
            </>
          ) : null}
        </span>
      )}
      {LANGUAGE_NAMES[language] ? <span className="text-caption text-fg-3">{LANGUAGE_NAMES[language]}</span> : null}
      <CopyCode value={current.code} label="Скопировать код" />
    </div>
  );

  return (
    <div data-slot="code-block" className={cn('overflow-hidden rounded-xl bg-surface-1 shadow-raised', className)} {...props}>
      {files.length > 1 ? (
        <Tabs.Root value={active} onValueChange={(value: number) => setActive(value)}>
          {header(true)}
          {files.map((file, index) => (
            <Tabs.Panel key={index} value={index}>
              <CodeLines code={file.code} language={languageOf(file)} highlight={marked} lineNumbers={lineNumbers} />
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      ) : (
        <>
          {header(false)}
          <CodeLines code={current.code} language={language} highlight={marked} lineNumbers={lineNumbers} />
        </>
      )}
    </div>
  );
}

export interface CodeBlockCommandProps extends Omit<ComponentProps<'div'>, 'children'> {
  command: string;
}

/** One shell command in a 44 capsule: «$ npm i …» and copy. */
export function CodeBlockCommand({ command, className, ...props }: CodeBlockCommandProps) {
  return (
    <div
      data-slot="code-block-command"
      className={cn('flex h-11 items-center gap-3 rounded-full bg-surface-1 pr-2 pl-4 shadow-raised', className)}
      {...props}
    >
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[22px] text-fg-1">
        <span aria-hidden className="pr-2 text-fg-3 select-none">
          $
        </span>
        {command}
      </code>
      <CopyCode value={command} label="Скопировать команду" />
    </div>
  );
}
