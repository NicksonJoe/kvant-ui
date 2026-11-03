import { Check, ChevronDown, ChevronRight, ChevronsUpDown, CircleAlert, Copy, Equal, TriangleAlert } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { useCopy } from '../lib/use-copy';
import { tokenizeCode, type CodeTokenKind } from './code-block';
import { SegmentedControl } from './segmented-control';
import { VirtualList } from './virtual-list';
import { Announce } from './visually-hidden';

export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
type JsonContainer = readonly JsonValue[] | { readonly [key: string]: JsonValue };
type JsonKey = string | number;

/** Files above this open lazily: only the top level, nodes on request. */
const LAZY_BYTES = 1024 * 1024;
/** Above this many rows the tree is a virtual list. */
const VIRTUAL_ROWS = 5000;
const ROW = 26;
const TEXT_ROW = 24;
const INDENT = 20;
const CONTEXT = 3;

const isContainer = (value: JsonValue): value is JsonContainer => typeof value === 'object' && value !== null;
const isList = (value: JsonContainer): value is readonly JsonValue[] => Array.isArray(value);
const children = (value: JsonContainer): [JsonKey, JsonValue][] => (isList(value) ? value.map((child, index) => [index, child]) : Object.entries(value));

const numbers = new Intl.NumberFormat('ru-RU');
const plurals = new Intl.PluralRules('ru');
/** «3 ключа», «12 элементов», «2 418 строк». */
function counted(count: number, [one, few, many]: readonly [string, string, string]): string {
  const rule = plurals.select(count);
  return `${numbers.format(count)} ${rule === 'one' ? one : rule === 'few' ? few : many}`;
}
const KEYS = ['ключ', 'ключа', 'ключей'] as const;
const ITEMS = ['элемент', 'элемента', 'элементов'] as const;
const LINES = ['строку', 'строки', 'строк'] as const;
const LINES_OF = ['строка', 'строки', 'строк'] as const;

function size(bytes: number): string {
  const short = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${short.format(bytes / 1024)} КБ`;
  return `${short.format(bytes / 1024 / 1024)} МБ`;
}

function segment(key: JsonKey): string {
  if (typeof key === 'number') return `[${key}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `['${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}']`;
}

/** JSONPath of a node: `$.client.contacts[0].phone`, `$['first name']`. */
export function jsonPath(path: readonly JsonKey[]): string {
  return `$${path.map(segment).join('')}`;
}

export interface JsonParseError {
  line: number;
  column: number;
  /** In Russian: «лишняя запятая». */
  reason: string;
}
export type JsonParseResult = { ok: true; value: JsonValue } | { ok: false; error: JsonParseError };

interface Spot {
  offset: number;
  reason: string;
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const WORD = /[A-Za-z_$][\w$]*/y;

/** Where and why JSON.parse gave up: a strict scanner that stops at the first problem. */
function locate(text: string): Spot {
  let at = 0;
  const space = () => {
    while (at < text.length && ' \t\n\r'.includes(text.charAt(at))) at++;
  };
  const end = (): Spot => ({ offset: text.length, reason: 'документ обрывается' });
  const word = () => {
    WORD.lastIndex = at;
    return WORD.exec(text)?.[0];
  };
  const string = (): Spot | null => {
    const start = at;
    at++;
    while (at < text.length) {
      const char = text.charAt(at);
      if (char === '"') {
        at++;
        return null;
      }
      if (char === '\n') break;
      if (char === '\\') {
        const escape = text.charAt(at + 1);
        if (escape === 'u' ? !/^[0-9a-fA-F]{4}$/.test(text.slice(at + 2, at + 6)) : !'"\\/bfnrt'.includes(escape) || escape === '') {
          return { offset: at, reason: 'неверная последовательность в строке' };
        }
        at += escape === 'u' ? 6 : 2;
        continue;
      }
      if (char < ' ') return { offset: at, reason: 'неверный символ в строке' };
      at++;
    }
    return { offset: start, reason: 'строка не закрыта' };
  };
  const number = (): Spot | null => {
    NUMBER.lastIndex = at;
    const match = NUMBER.exec(text)?.[0];
    const next = match ? text.charAt(at + match.length) : '';
    if (!match || /[\d.]/.test(next)) return { offset: at, reason: 'неверное число' };
    at += match.length;
    return null;
  };
  const object = (): Spot | null => {
    at++;
    space();
    if (text.charAt(at) === '}') {
      at++;
      return null;
    }
    for (;;) {
      space();
      const char = text.charAt(at);
      if (char === '') return end();
      if (char === "'") return { offset: at, reason: 'кавычки должны быть двойными' };
      if (char === ',') return { offset: at, reason: 'лишняя запятая' };
      if (char !== '"') return { offset: at, reason: word() ? 'ключ без кавычек' : `лишний символ «${char}»` };
      const key = string();
      if (key) return key;
      space();
      if (text.charAt(at) === '') return end();
      if (text.charAt(at) !== ':') return { offset: at, reason: 'нет двоеточия' };
      at++;
      const inner = value();
      if (inner) return inner;
      space();
      const next = text.charAt(at);
      if (next === '') return end();
      if (next === '}') {
        at++;
        return null;
      }
      if (next !== ',') return { offset: at, reason: 'нет запятой' };
      const comma = at;
      at++;
      space();
      if (text.charAt(at) === '}') return { offset: comma, reason: 'лишняя запятая' };
    }
  };
  const array = (): Spot | null => {
    at++;
    space();
    if (text.charAt(at) === ']') {
      at++;
      return null;
    }
    for (;;) {
      const inner = value();
      if (inner) return inner;
      space();
      const next = text.charAt(at);
      if (next === '') return end();
      if (next === ']') {
        at++;
        return null;
      }
      if (next !== ',') return { offset: at, reason: 'нет запятой' };
      const comma = at;
      at++;
      space();
      if (text.charAt(at) === ']') return { offset: comma, reason: 'лишняя запятая' };
    }
  };
  const value = (): Spot | null => {
    space();
    const char = text.charAt(at);
    if (char === '') return end();
    if (char === '{') return object();
    if (char === '[') return array();
    if (char === '"') return string();
    if (char === "'") return { offset: at, reason: 'кавычки должны быть двойными' };
    if (char === '-' || (char >= '0' && char <= '9')) return number();
    if (char === '/' && '/*'.includes(text.charAt(at + 1) || ' ')) return { offset: at, reason: 'комментарии в JSON не допускаются' };
    if (char === ',') return { offset: at, reason: 'лишняя запятая' };
    const name = word();
    if (name === 'true' || name === 'false' || name === 'null') {
      at += name.length;
      return null;
    }
    return { offset: at, reason: name ? `неизвестное слово «${name}»` : `лишний символ «${char}»` };
  };

  space();
  if (at >= text.length) return { offset: 0, reason: 'документ пустой' };
  const problem = value();
  if (problem) return problem;
  space();
  if (at < text.length) return { offset: at, reason: text.startsWith('//', at) || text.startsWith('/*', at) ? 'комментарии в JSON не допускаются' : 'лишний текст после документа' };
  return { offset: 0, reason: 'не удалось прочитать' };
}

/** JSON.parse, and on failure the line, column and reason in Russian: «строка 14, символ 17 — лишняя запятая». */
export function parseJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as JsonValue };
  } catch {
    // the engine's message is English and differs between browsers: find the place ourselves
  }
  const spot = locate(text);
  let line = 1;
  let start = 0;
  for (let index = 0; index < spot.offset; index++) {
    if (text.charCodeAt(index) === 10) {
      line++;
      start = index + 1;
    }
  }
  return { ok: false, error: { line, column: spot.offset - start + 1, reason: spot.reason } };
}

export type JsonRowKind = 'value' | 'open' | 'collapsed' | 'close';

export interface JsonRow {
  /** JSONPath of the node; the closing row repeats the path of its container. */
  path: string;
  parent: string | null;
  depth: number;
  key: JsonKey | null;
  value: JsonValue;
  kind: JsonRowKind;
  /** Children of a container. */
  size: number;
  /** Place among the siblings, for aria-posinset / aria-setsize. */
  position: number;
  setSize: number;
}

/** Visible rows of the tree: an expanded container gives an opening and a closing row, a collapsed one a single row. */
export function flattenJson(value: JsonValue, expanded: ReadonlySet<string>): JsonRow[] {
  const rows: JsonRow[] = [];
  const walk = (node: JsonValue, path: string, parent: string | null, depth: number, key: JsonKey | null, position: number, setSize: number) => {
    const base = { path, parent, depth, key, value: node, position, setSize };
    if (!isContainer(node)) {
      rows.push({ ...base, kind: 'value', size: 0 });
      return;
    }
    const list = children(node);
    if (!expanded.has(path)) {
      rows.push({ ...base, kind: 'collapsed', size: list.length });
      return;
    }
    rows.push({ ...base, kind: 'open', size: list.length });
    list.forEach(([childKey, child], index) => walk(child, path + segment(childKey), path, depth + 1, childKey, index + 1, list.length));
    rows.push({ ...base, kind: 'close', size: list.length });
  };
  walk(value, '$', null, 0, null, 1, 1);
  return rows;
}

function containerPaths(value: JsonValue): string[] {
  const paths: string[] = [];
  const walk = (node: JsonValue, path: string) => {
    if (!isContainer(node)) return;
    paths.push(path);
    for (const [key, child] of children(node)) walk(child, path + segment(key));
  };
  walk(value, '$');
  return paths;
}

export type DiffLineKind = 'same' | 'removed' | 'added';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  /** Line number in the old version. */
  old?: number;
  /** Line number in the new version. */
  new?: number;
  /** A removed line and the added line right after it are two versions of one line: shown in one row, words marked. */
  paired: boolean;
}

export interface DiffWordPart {
  text: string;
  changed: boolean;
}

const TOKEN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;

function commonTokens(a: readonly string[], b: readonly string[]): boolean[][] | null {
  if (a.length * b.length > 40_000) return null;
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    const row = table[i] as Uint16Array;
    const below = table[i + 1] as Uint16Array;
    for (let j = b.length - 1; j >= 0; j--) row[j] = a[i] === b[j] ? (below[j + 1] ?? 0) + 1 : Math.max(below[j] ?? 0, row[j + 1] ?? 0);
  }
  const keepA = a.map(() => false);
  const keepB = b.map(() => false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      keepA[i++] = true;
      keepB[j++] = true;
    } else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) i++;
    else j++;
  }
  return [keepA, keepB];
}

function parts(tokens: readonly string[], keep: readonly boolean[]): DiffWordPart[] {
  const result: DiffWordPart[] = [];
  tokens.forEach((text, index) => {
    const changed = !keep[index];
    const last = result.at(-1);
    if (last && last.changed === changed) last.text += text;
    else result.push({ text, changed });
  });
  return result;
}

/** Words that differ between two versions of a line. */
export function diffWords(before: string, after: string): { before: DiffWordPart[]; after: DiffWordPart[] } {
  const a = before.match(TOKEN) ?? [];
  const b = after.match(TOKEN) ?? [];
  const common = commonTokens(a, b);
  if (!common) return { before: [{ text: before, changed: true }], after: [{ text: after, changed: true }] };
  const [keepA = [], keepB = []] = common;
  return { before: parts(a, keepA), after: parts(b, keepB) };
}

function similar(before: string, after: string): boolean {
  const { before: left, after: right } = diffWords(before, after);
  const same = [...left, ...right].filter((part) => !part.changed).reduce((total, part) => total + part.text.length, 0);
  return same / Math.max(before.length + after.length, 1) >= 0.35;
}

type Step = '=' | '-' | '+';
/** Past this many edits the middle is shown as removed then added instead of a minimal diff. */
const MAX_EDITS = 2000;

/** Myers' shortest edit script between two line lists. */
function editScript(a: readonly string[], b: readonly string[]): Step[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];
  for (let d = 0; d <= max; d++) {
    if (d > MAX_EDITS) {
      // shortcut: a huge rewrite reads as one removed block and one added block, exact steps cost too much memory
      return [...Array<Step>(n).fill('-'), ...Array<Step>(m).fill('+')];
    }
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v[offset + k - 1] ?? 0) < (v[offset + k + 1] ?? 0)) ? (v[offset + k + 1] ?? 0) : (v[offset + k - 1] ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        const steps: Step[] = [];
        let cx = n;
        let cy = m;
        for (let back = d; back >= 0; back--) {
          const row = trace[back] as Int32Array;
          const at = (kk: number) => row[kk + back + 1] ?? 0;
          const ck = cx - cy;
          const prevK = ck === -back || (ck !== back && at(ck - 1) < at(ck + 1)) ? ck + 1 : ck - 1;
          const prevX = at(prevK);
          const prevY = prevX - prevK;
          while (cx > prevX && cy > prevY) {
            steps.push('=');
            cx--;
            cy--;
          }
          if (back > 0) steps.push(cx === prevX ? '+' : '-');
          cx = prevX;
          cy = prevY;
        }
        return steps.reverse();
      }
    }
  }
  return [];
}

export interface DiffOptions {
  /** Lines that differ only in spaces count as the same (default). */
  ignoreWhitespace?: boolean;
}

/** Line diff of two texts: numbered on both sides, a removed line paired with its new version when they are alike. */
export function diffLines(before: string, after: string, { ignoreWhitespace = true }: DiffOptions = {}): DiffLine[] {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  const key = (line: string) => (ignoreWhitespace ? line.replace(/\s+/g, '') : line);
  const steps = editScript(oldLines.map(key), newLines.map(key));
  const lines: DiffLine[] = [];
  let o = 0;
  let n = 0;
  let index = 0;
  while (index < steps.length) {
    if (steps[index] === '=') {
      lines.push({ kind: 'same', text: newLines[n] ?? '', old: o + 1, new: n + 1, paired: false });
      o++;
      n++;
      index++;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    for (; index < steps.length && steps[index] !== '='; index++) {
      if (steps[index] === '-') removed.push({ kind: 'removed', text: oldLines[o] ?? '', old: ++o, paired: false });
      else added.push({ kind: 'added', text: newLines[n] ?? '', new: ++n, paired: false });
    }
    for (let at = 0; at < Math.max(removed.length, added.length); at++) {
      const gone = removed[at];
      const come = added[at];
      if (gone && come && similar(gone.text, come.text)) {
        gone.paired = true;
        come.paired = true;
      }
      if (gone) lines.push(gone);
      if (come) lines.push(come);
    }
  }
  return lines;
}

type Piece = { type: 'line'; line: DiffLine; index: number } | { type: 'fold'; id: number; lines: DiffLine[] };

/** Unchanged runs longer than 6 lines fold, keeping 3 lines of context next to the changes. */
function foldLines(lines: readonly DiffLine[], open: ReadonlySet<number>): Piece[] {
  const pieces: Piece[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index]?.kind !== 'same') {
      pieces.push({ type: 'line', line: lines[index] as DiffLine, index });
      index++;
      continue;
    }
    const start = index;
    while (index < lines.length && lines[index]?.kind === 'same') index++;
    const top = start === 0 ? 0 : CONTEXT;
    const bottom = index === lines.length ? 0 : CONTEXT;
    const hidden = index - start - top - bottom;
    const folds = index - start > CONTEXT * 2 && hidden > 0 && !open.has(start);
    for (let at = start; at < index; at++) {
      if (folds && at === start + top) {
        pieces.push({ type: 'fold', id: start, lines: lines.slice(at, at + hidden) });
        at += hidden - 1;
        continue;
      }
      pieces.push({ type: 'line', line: lines[at] as DiffLine, index: at });
    }
  }
  return pieces;
}

const valueColors: Record<'string' | 'number' | 'boolean' | 'null', string> = {
  string: 'text-success-soft-fg',
  number: 'text-warning-soft-fg',
  boolean: 'text-accent-soft-fg',
  null: 'text-fg-3 italic',
};
// the same palette as CodeBlock: strings green, numbers ochre, keywords and booleans blue, comments grey
const tokenColors: Record<CodeTokenKind, string> = {
  plain: '',
  keyword: 'text-accent-soft-fg',
  string: 'text-success-soft-fg',
  number: 'text-warning-soft-fg',
  type: 'text-warning-soft-fg',
  comment: 'text-fg-3 italic',
};

// compact 28 track for card headers
const headerSegmented = 'h-7! rounded-full! bg-fill-2! [&_[data-slot=segment]]:px-2.5 [&_[data-slot=segment]]:text-caption';
// the virtual list's own filler draws contact rows; under JSON it draws one short line per 26 row
const jsonFiller =
  '[&_[data-slot=virtual-list-filler]]:[background:linear-gradient(transparent_9px,var(--color-fill-1)_9px_17px,transparent_17px)_52px_0/min(40%,240px)_26px_repeat-y]';
const card = 'flex flex-col overflow-clip rounded-xl bg-surface-1 shadow-raised';

function Skeleton({ slot, lines }: { slot: string; lines: readonly string[] }) {
  return (
    <div data-slot={slot} aria-hidden="true" className="flex flex-col gap-2.5 p-4">
      {lines.map((line, index) => (
        <span key={index} className={cn('h-2 rounded-full', line)} />
      ))}
    </div>
  );
}

function TextLines({ text, label, errorLine, height }: { text: string; label: string; errorLine?: number; height: number }) {
  const lines = useMemo(() => text.split('\n'), [text]);
  const line = (index: number) => (
    <div key={index} data-error-line={index + 1 === errorLine || undefined} className={cn('flex h-6 whitespace-pre', index + 1 === errorLine && 'bg-danger/8')}>
      <span aria-hidden className={cn('w-10 shrink-0 pr-2.5 text-right select-none', index + 1 === errorLine ? 'text-danger-soft-fg' : 'text-fg-4')}>
        {index + 1}
      </span>
      <span className="pr-4">
        {tokenizeCode(lines[index] ?? '', 'json').map((token, at) => (
          <span key={at} className={tokenColors[token.kind]}>
            {token.text}
          </span>
        ))}
      </span>
    </div>
  );
  if (lines.length > VIRTUAL_ROWS) {
    return (
      <div data-slot="json-viewer-text" className="font-mono text-body-xs/6 text-fg-1" style={{ height }}>
        <VirtualList aria-label={label} count={lines.length} rowHeight={TEXT_ROW} renderRow={line} className="h-full" />
      </div>
    );
  }
  return (
    <div data-slot="json-viewer-text" className="overflow-x-auto py-2 font-mono text-body-xs/6 text-fg-1">
      <div className="min-w-max">{lines.map((_, index) => line(index))}</div>
    </div>
  );
}

function ParseError({ text, error, onText }: { text: string; error: JsonParseError; onText: () => void }) {
  const lines = text.split('\n');
  const shown = [error.line - 1, error.line].filter((number) => number >= 1 && number <= lines.length);
  return (
    <>
      <div data-slot="json-viewer-error" className="flex items-center gap-2 bg-danger-soft px-4 py-3">
        <CircleAlert aria-hidden className="size-3.5 shrink-0 stroke-2 text-danger" />
        <p role="alert" className="min-w-0 flex-1 text-body-xs/4 font-medium text-danger-soft-fg">
          Не JSON: строка {error.line}, символ {error.column} — {error.reason}
        </p>
        <button type="button" onClick={onText} className="shrink-0 rounded-full text-caption font-semibold text-accent-soft-fg hover:underline">
          Как текст
        </button>
      </div>
      <div className="overflow-x-auto pb-1 font-mono text-body-xs/6 text-fg-1">
        {shown.map((number) => {
          const source = lines[number - 1] ?? '';
          const marked = number === error.line;
          return (
            <div key={number} data-error-line={marked || undefined} className={cn('flex min-w-max whitespace-pre', marked && 'bg-danger/8')}>
              <span aria-hidden className={cn('w-10 shrink-0 pr-2.5 text-right select-none', marked ? 'text-danger-soft-fg' : 'text-fg-4')}>
                {number}
              </span>
              <span className="pr-4">
                {marked && error.column <= source.length ? (
                  <>
                    {source.slice(0, error.column - 1)}
                    <span data-slot="json-viewer-error-char" className="font-bold text-danger">
                      {source.charAt(error.column - 1)}
                    </span>
                    {source.slice(error.column)}
                  </>
                ) : (
                  source
                )}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export type JsonViewerView = 'tree' | 'text';

export interface JsonViewerProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  /** The document: a value, or JSON text that is parsed (with a pointed error when it is broken). */
  value: JsonValue | string;
  /** Mono name in the header: «webhook · deal.updated»; also the tree's name. */
  title?: ReactNode;
  /** After the title: status badge, time, size. */
  meta?: ReactNode;
  /** JSONPaths of open nodes: ['$', '$.client']. By default everything is open, files over 1 MB show the top level. */
  defaultExpanded?: readonly string[];
  defaultView?: JsonViewerView;
  loading?: boolean;
  /** Height of the tree once it is a virtual list (over 5 000 rows) and of long text. */
  height?: number;
}

/**
 * Service viewer for integration logs and webhooks: a JSON tree in JetBrains Mono with the code block palette,
 * folding, copying a value or its JSONPath. Files over 1 MB open lazily, over 5 000 rows the tree is virtual.
 */
export function JsonViewer({
  value,
  title,
  meta,
  defaultExpanded,
  defaultView = 'tree',
  loading = false,
  height = 480,
  className,
  'aria-label': ariaLabel,
  ...props
}: JsonViewerProps) {
  const parsed = useMemo<JsonParseResult>(() => (typeof value === 'string' ? parseJson(value) : { ok: true, value }), [value]);
  const text = useMemo(() => (typeof value === 'string' ? value : JSON.stringify(value, null, 2)), [value]);
  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const lazy = bytes > LAZY_BYTES;
  const root: JsonValue = parsed.ok ? parsed.value : null;
  const containers = useMemo(() => (lazy ? [] : containerPaths(root)), [lazy, root]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded ?? (lazy ? ['$'] : containers)));
  const [view, setView] = useState<JsonViewerView>(defaultView);
  const [active, setActive] = useState<string | null>(null);
  const [copied, copy] = useCopy();
  const [copiedWhat, setCopiedWhat] = useState<'path' | 'value'>('path');
  const body = useRef<HTMLDivElement>(null);
  const label = ariaLabel ?? (typeof title === 'string' ? title : 'JSON');

  const rows = useMemo(() => (parsed.ok ? flattenJson(parsed.value, expanded) : []), [parsed, expanded]);
  const virtual = rows.length > VIRTUAL_ROWS;
  const tabStop = active ?? rows[0]?.path ?? null;
  const allOpen = containers.length > 0 && containers.every((path) => expanded.has(path));

  const toggle = (path: string, open?: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open ?? !next.has(path)) next.add(path);
      else next.delete(path);
      return next;
    });

  const element = (path: string) => body.current?.querySelector<HTMLElement>(`[data-json-row][data-path="${CSS.escape(path)}"]`) ?? null;
  // A row may not exist yet: just opened, or outside the window of the virtual list. Try now, then on a few frames.
  const focusPath = (path: string, tries = 6) => {
    const target = element(path);
    if (target) {
      target.focus({ preventScroll: virtual });
      return;
    }
    if (tries > 0) requestAnimationFrame(() => focusPath(path, tries - 1));
  };
  const goTo = (index: number) => {
    const row = rows[index];
    if (!row) return;
    setActive(row.path);
    if (virtual) {
      const viewport = body.current?.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]');
      if (viewport) {
        const top = index * ROW;
        if (top < viewport.scrollTop) viewport.scrollTop = top;
        else if (top + ROW > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = top + ROW - viewport.clientHeight;
      }
    }
    focusPath(row.path);
  };
  const step = (from: number, direction: 1 | -1) => {
    for (let index = from + direction; index >= 0 && index < rows.length; index += direction) {
      if (rows[index]?.kind !== 'close') return index;
    }
    return from;
  };

  const copyPath = (path: string) => {
    setCopiedWhat('path');
    void copy(path);
  };
  const copyValue = (row: JsonRow) => {
    setCopiedWhat('value');
    void copy(typeof row.value === 'string' ? row.value : isContainer(row.value) ? JSON.stringify(row.value, null, 2) : String(row.value));
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const row = rows[index];
    if (!row) return;
    const container = row.kind === 'open' || row.kind === 'collapsed';
    if ((event.metaKey || event.ctrlKey) && (event.code === 'KeyC' || event.key.toLowerCase() === 'c')) {
      // a text selection inside the row copies as usual
      if (window.getSelection()?.toString()) return;
      event.preventDefault();
      if (event.shiftKey) copyPath(row.path);
      else copyValue(row);
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') goTo(step(index, key === 'ArrowDown' ? 1 : -1));
    else if (key === 'Home') goTo(0);
    else if (key === 'End') goTo(step(rows.length, -1));
    else if (key === 'ArrowRight') {
      if (row.kind === 'collapsed') toggle(row.path, true);
      else if (row.kind === 'open' && rows[index + 1]?.kind !== 'close') goTo(index + 1);
    } else if (key === 'ArrowLeft') {
      if (row.kind === 'open') toggle(row.path, false);
      else if (row.parent !== null) goTo(rows.findIndex((entry) => entry.path === row.parent && entry.kind === 'open'));
    } else if ((key === 'Enter' || key === ' ') && container) toggle(row.path);
    else if (key === '*') {
      setExpanded((current) => {
        const next = new Set(current);
        for (const entry of rows) if (entry.parent === row.parent && (entry.kind === 'collapsed' || entry.kind === 'open')) next.add(entry.path);
        return next;
      });
    } else return;
    event.preventDefault();
    // Home and End belong to the tree here, not to the virtual list around it
    event.stopPropagation();
  };

  const renderRow = (row: JsonRow, index: number) => {
    if (row.kind === 'close') {
      return (
        <div key={`${row.path}/close`} data-json-row="" role="none" aria-hidden="true" className="flex h-[26px] items-center gap-0.5 font-mono text-body-xs/5 text-fg-3" style={{ paddingLeft: 12 + row.depth * INDENT }}>
          <span className="w-4 shrink-0" />
          {isContainer(row.value) && isList(row.value) ? ']' : '}'}
        </div>
      );
    }
    const container = row.kind !== 'value';
    const list = isContainer(row.value) && isList(row.value);
    const selected = row.path === active;
    const type = row.value === null ? 'null' : (typeof row.value as 'string' | 'number' | 'boolean' | 'object');
    const key =
      row.key === null ? null : typeof row.key === 'number' ? (
        <span className="text-fg-3">{row.key}</span>
      ) : (
        <span className="text-fg-1">{JSON.stringify(row.key)}</span>
      );
    return (
      <div
        key={row.path}
        data-json-row=""
        data-path={row.path}
        data-json-index={index}
        role={virtual ? (container ? 'button' : undefined) : 'treeitem'}
        aria-level={virtual ? undefined : row.depth + 1}
        aria-posinset={virtual ? undefined : row.position}
        aria-setsize={virtual ? undefined : row.setSize}
        aria-expanded={container ? row.kind === 'open' : undefined}
        aria-selected={virtual ? undefined : selected}
        data-selected={selected || undefined}
        tabIndex={row.path === tabStop ? 0 : -1}
        onFocus={() => setActive(row.path)}
        onClick={() => setActive(row.path)}
        onKeyDown={(event) => onRowKeyDown(event, index)}
        className={cn(
          'flex h-[26px] cursor-default items-center pr-2 font-mono text-body-xs/5 whitespace-nowrap text-fg-1 focus-visible:-outline-offset-2',
          row.kind === 'collapsed' ? 'gap-1.5' : 'gap-0.5',
          selected ? 'bg-accent-soft' : 'hover:bg-fill-1',
        )}
        style={{ paddingLeft: 12 + row.depth * INDENT }}
      >
        <span className="flex w-4 shrink-0 justify-center">
          {container ? (
            <span
              aria-hidden
              onClick={(event) => {
                event.stopPropagation();
                setActive(row.path);
                toggle(row.path);
              }}
              className="grid size-4 place-items-center rounded-xs text-fg-3 hover:text-fg-1"
            >
              {row.kind === 'open' ? <ChevronDown className="size-3 stroke-[2.5]" /> : <ChevronRight className="size-3 stroke-[2.5]" />}
            </span>
          ) : null}
        </span>
        <span className={cn('flex min-w-0 items-center', row.kind === 'collapsed' && 'gap-1.5', selected && 'flex-1')}>
          <span className="shrink-0 whitespace-pre">
            {key}
            {row.kind === 'value' ? (
              <span className="text-fg-3">{key ? ': ' : ''}</span>
            ) : row.kind === 'open' ? (
              <span className="text-fg-3">
                {key ? ': ' : ''}
                {list ? '[' : '{'}
              </span>
            ) : key ? (
              <span className="text-fg-3">:</span>
            ) : null}
          </span>
          {row.kind === 'value' ? (
            <span data-type={type} className={cn('min-w-0 truncate', valueColors[type === 'object' ? 'null' : type])}>
              {typeof row.value === 'string' ? JSON.stringify(row.value) : String(row.value)}
            </span>
          ) : null}
          {row.kind === 'open' && row.key === null ? (
            <span className="ml-1.5 font-sans text-caption text-fg-3">{counted(row.size, list ? ITEMS : KEYS)}</span>
          ) : null}
          {row.kind === 'collapsed' ? (
            <span
              onClick={(event) => {
                event.stopPropagation();
                setActive(row.path);
                toggle(row.path, true);
              }}
              className="flex h-[18px] shrink-0 items-center rounded-[5px] bg-fill-2 px-1.5 text-[11px]/[14px] font-medium text-fg-2 hover:bg-fill-3"
            >
              {list ? '[…]' : '{…}'} {counted(row.size, list ? ITEMS : KEYS)}
            </span>
          ) : null}
        </span>
        {selected ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Скопировать путь"
            onClick={(event) => {
              event.stopPropagation();
              copyPath(row.path);
            }}
            className="ml-auto flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-surface-1 px-2 font-sans text-[11px]/[14px] font-medium text-fg-2 shadow-[inset_0_0_0_1px_var(--color-border)] hover:text-fg-1 [&_svg]:size-3 [&_svg]:stroke-2"
          >
            <Copy aria-hidden />
            Путь
          </button>
        ) : null}
      </div>
    );
  };

  let content: ReactNode;
  if (loading) content = <Skeleton slot="json-viewer-skeleton" lines={['w-3/5 bg-fill-2', 'w-2/5 bg-fill-1', 'w-[70%] bg-fill-2']} />;
  else if (view === 'text') content = <TextLines text={text} label={label} errorLine={parsed.ok ? undefined : parsed.error.line} height={height} />;
  else if (!parsed.ok) content = <ParseError text={text} error={parsed.error} onText={() => setView('text')} />;
  else if (virtual) {
    content = (
      <div ref={body} className={jsonFiller} style={{ height }}>
        <VirtualList aria-label={label} count={rows.length} rowHeight={ROW} renderRow={(index) => (rows[index] ? renderRow(rows[index], index) : null)} className="h-full" />
      </div>
    );
  } else {
    content = (
      <div ref={body} role="tree" aria-label={label} className="flex flex-col overflow-x-auto py-2">
        {rows.map(renderRow)}
      </div>
    );
  }

  return (
    <div data-slot="json-viewer" aria-busy={loading || undefined} className={cn(card, className)} {...props}>
      <div data-slot="json-viewer-header" className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-separator px-4 py-2">
        {title ? <span className="min-w-0 truncate font-mono text-body-xs/4 font-medium text-fg-1">{title}</span> : null}
        {meta}
        <span className="ml-auto flex shrink-0 items-center gap-2.5">
          {parsed.ok && !loading ? (
            <SegmentedControl<JsonViewerView>
              aria-label="Вид"
              value={view}
              onValueChange={setView}
              options={[
                { value: 'tree', label: 'Дерево' },
                { value: 'text', label: 'Текст' },
              ]}
              className={headerSegmented}
            />
          ) : null}
          {parsed.ok && !loading && !lazy && view === 'tree' && containers.length > 1 ? (
            <button
              type="button"
              onClick={() => setExpanded(new Set(allOpen ? ['$'] : containers))}
              className="h-6 shrink-0 rounded-full px-1.5 text-caption font-medium text-fg-2 hover:bg-fill-1 hover:text-fg-1"
            >
              {allOpen ? 'Свернуть всё' : 'Развернуть всё'}
            </button>
          ) : null}
        </span>
      </div>
      {lazy && parsed.ok && !loading && view === 'tree' ? (
        <div data-slot="json-viewer-notice" className="flex flex-col gap-1 border-b border-separator px-4 py-3">
          <p className="text-body-xs/4 font-medium text-fg-1">Файл {size(bytes)}</p>
          <p className="text-caption text-fg-3">Показан верхний уровень, узлы раскрываются по запросу</p>
        </div>
      ) : null}
      {content}
      {active !== null && view === 'tree' && parsed.ok && !loading ? (
        <div data-slot="json-viewer-path" className="flex h-10 shrink-0 items-center gap-2 border-t border-separator bg-surface-2 px-4 text-caption">
          <span className="text-fg-3">Путь</span>
          <span className="min-w-0 truncate font-mono font-medium text-fg-1">{active}</span>
          <span className="flex-1" />
          {copied ? (
            <span className="flex shrink-0 items-center gap-1.5 font-medium text-success-soft-fg">
              <Check aria-hidden className="size-3.5 stroke-[2.2] text-success" />
              {copiedWhat === 'path' ? 'Путь скопирован' : 'Значение скопировано'}
            </span>
          ) : null}
        </div>
      ) : null}
      <Announce>{copied ? (copiedWhat === 'path' ? 'Путь скопирован' : 'Значение скопировано') : ''}</Announce>
    </div>
  );
}

const WIDE = '(min-width: 1024px)';
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

export type JsonDiffView = 'split' | 'unified';

export interface JsonDiffProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  /** Old version: a value (printed with 2 spaces) or text — JSON, YAML, anything line by line. */
  before: JsonValue | string;
  after: JsonValue | string;
  /** Mono file name: «deal-1042.yaml». */
  title?: ReactNode;
  /** «версия 3 → 4 · Илья Громов, сегодня 11:20». */
  meta?: ReactNode;
  /** auto — side by side from 1024 px, one column below. */
  defaultView?: JsonDiffView | 'auto';
  ignoreWhitespace?: boolean;
  /** Changed lines drawn at once; the rest after «Загрузить всё». */
  maxChanges?: number;
  loading?: boolean;
}

/** Two versions of a record line by line: removed danger-soft, added success-soft, changed words stronger than the line. */
export function JsonDiff({
  before,
  after,
  title,
  meta,
  defaultView = 'auto',
  ignoreWhitespace = true,
  maxChanges = 500,
  loading = false,
  className,
  ...props
}: JsonDiffProps) {
  const oldText = useMemo(() => (typeof before === 'string' ? before : JSON.stringify(before, null, 2)), [before]);
  const newText = useMemo(() => (typeof after === 'string' ? after : JSON.stringify(after, null, 2)), [after]);
  const lines = useMemo(() => diffLines(oldText, newText, { ignoreWhitespace }), [oldText, newText, ignoreWhitespace]);
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);
  const [chosen, setChosen] = useState<JsonDiffView | null>(defaultView === 'auto' ? null : defaultView);
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const [all, setAll] = useState(false);
  const view = chosen ?? (wide ? 'split' : 'unified');

  const removed = lines.filter((line) => line.kind === 'removed').length;
  const added = lines.filter((line) => line.kind === 'added').length;
  const changes = removed + added;
  const limited = !all && changes > maxChanges;
  const shown = useMemo(() => {
    if (!limited) return lines;
    let seen = 0;
    const cut = lines.findIndex((line) => line.kind !== 'same' && ++seen > maxChanges);
    return cut < 0 ? lines : lines.slice(0, cut);
  }, [lines, limited, maxChanges]);
  const pieces = useMemo(() => foldLines(shown, open), [shown, open]);

  const words = (line: DiffLine, index: number): ReactNode => {
    if (!line.paired) return line.text;
    const other = line.kind === 'removed' ? shown[index + 1] : shown[index - 1];
    if (!other) return line.text;
    const result = line.kind === 'removed' ? diffWords(line.text, other.text).before : diffWords(other.text, line.text).after;
    return result.map((part, at) =>
      part.changed ? (
        <span key={at} data-slot="json-diff-word" className={cn('rounded-[3px] px-0.5', line.kind === 'removed' ? 'bg-danger/22' : 'bg-success/24')}>
          {part.text}
        </span>
      ) : (
        <span key={at}>{part.text}</span>
      ),
    );
  };
  const tone = (kind: DiffLineKind) => (kind === 'removed' ? 'bg-danger-soft' : kind === 'added' ? 'bg-success-soft' : '');
  const numberTone = (kind: DiffLineKind) => (kind === 'removed' ? 'text-danger-soft-fg' : kind === 'added' ? 'text-success-soft-fg' : 'text-fg-4');
  const sign = (kind: DiffLineKind) => (kind === 'removed' ? '−' : kind === 'added' ? '+' : '');

  const fold = (piece: Extract<Piece, { type: 'fold' }>) => {
    const first = piece.lines[0]?.new ?? 0;
    const last = piece.lines.at(-1)?.new ?? 0;
    const unfold = () => setOpen((current) => new Set([...current, piece.id]));
    return view === 'split' ? (
      <button
        key={`fold-${piece.id}`}
        type="button"
        data-slot="json-diff-fold"
        onClick={unfold}
        className="flex h-8 w-full shrink-0 items-center gap-2.5 border-y border-fill-2 bg-surface-2 pl-4 text-left text-caption hover:bg-fill-1"
      >
        <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 stroke-2 text-accent-soft-fg" />
        <span className="font-semibold text-accent-soft-fg">Показать {counted(piece.lines.length, LINES)} без изменений</span>
        <span className="font-mono text-overline font-medium text-fg-3">
          {first}–{last}
        </span>
      </button>
    ) : (
      <button
        key={`fold-${piece.id}`}
        type="button"
        data-slot="json-diff-fold"
        onClick={unfold}
        className="flex h-8 w-full shrink-0 items-center gap-2.5 bg-surface-2 pl-4 text-left text-caption hover:bg-fill-1"
      >
        <span className="font-mono text-fg-3">
          @@ {first}–{last} @@
        </span>
        <span className="font-semibold text-accent-soft-fg">Показать {counted(piece.lines.length, LINES)}</span>
      </button>
    );
  };

  const unifiedRow = (line: DiffLine, index: number) => (
    <div key={index} data-slot="json-diff-row" data-kind={line.kind} className={cn('flex', tone(line.kind))}>
      <span aria-hidden className={cn('w-10 shrink-0 pr-2 text-right select-none', numberTone(line.kind))}>
        {line.kind === 'added' ? '' : line.old}
      </span>
      <span aria-hidden className={cn('w-10 shrink-0 pr-2 text-right select-none', numberTone(line.kind))}>
        {line.kind === 'removed' ? '' : line.new}
      </span>
      <span className={cn('w-6 shrink-0 select-none', numberTone(line.kind))}>{sign(line.kind)}</span>
      <span className="min-w-0 flex-1 pr-4 whitespace-pre-wrap wrap-anywhere">{words(line, index)}</span>
    </div>
  );

  const cell = (line: DiffLine | null, index: number, left: boolean) =>
    line ? (
      <div key={left ? 'old' : 'new'} data-kind={line.kind} className={cn('flex min-w-0 flex-1 basis-0', tone(line.kind), left && 'border-r border-separator')}>
        <span aria-hidden className={cn('w-12 shrink-0 pr-3 text-right select-none', numberTone(line.kind))}>
          {left ? line.old : line.new}
        </span>
        <span className={cn('w-5 shrink-0 select-none', numberTone(line.kind))}>{sign(line.kind)}</span>
        <span className="min-w-0 flex-1 pr-3 whitespace-pre-wrap wrap-anywhere">{words(line, index)}</span>
      </div>
    ) : (
      <div
        key={left ? 'old' : 'new'}
        data-slot="json-diff-empty"
        aria-hidden
        className={cn('flex-1 basis-0 bg-[repeating-linear-gradient(135deg,var(--color-fill-1)_0_4px,transparent_4px_8px)]', left && 'border-r border-separator')}
      />
    );

  const splitRows: ReactNode[] = [];
  for (let at = 0; at < pieces.length; at++) {
    const piece = pieces[at] as Piece;
    if (piece.type === 'fold') {
      splitRows.push(fold(piece));
      continue;
    }
    const { line, index } = piece;
    const next = pieces[at + 1];
    let pair: ReactNode;
    if (line.kind === 'same') pair = [cell(line, index, true), cell(line, index, false)];
    else if (line.kind === 'removed' && line.paired && next?.type === 'line') {
      pair = [cell(line, index, true), cell(next.line, next.index, false)];
      at++;
    } else pair = line.kind === 'removed' ? [cell(line, index, true), cell(null, index, false)] : [cell(null, index, true), cell(line, index, false)];
    splitRows.push(
      <div key={index} data-slot="json-diff-row" className="flex">
        {pair}
      </div>,
    );
  }

  let content: ReactNode;
  if (loading) {
    content = (
      <div data-slot="json-diff-skeleton" aria-hidden="true" className="flex h-18 flex-col justify-center gap-2 px-4">
        <div className="flex gap-2.5">
          <span className="h-2 w-6 shrink-0 rounded-full bg-fill-2" />
          <span className="h-2 w-[55%] rounded-full bg-fill-2" />
        </div>
        <div className="flex gap-2.5">
          <span className="h-2 w-6 shrink-0 rounded-full bg-fill-1" />
          <span className="h-2 w-2/5 rounded-full bg-danger-soft" />
        </div>
      </div>
    );
  } else if (!changes) {
    content = (
      <div data-slot="json-diff-same" className="flex min-h-18 items-center gap-3 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill-1 text-fg-3">
          <Equal aria-hidden className="size-4 stroke-2" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-body-xs/4 font-medium text-fg-1">Версии совпадают</span>
          <span className="text-caption text-fg-3">{oldText === newText ? 'Ни одной изменённой строки' : 'Изменились только пробелы — они скрыты'}</span>
        </span>
      </div>
    );
  } else {
    content = (
      <>
        {limited ? (
          <div data-slot="json-diff-limit" className="flex min-h-18 items-center gap-3 border-b border-separator px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warning-soft text-warning-soft-fg">
              <TriangleAlert aria-hidden className="size-4 stroke-2" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-xs/4 font-medium text-fg-1">Изменений много — {counted(changes, LINES_OF)}</span>
              <span className="text-caption text-fg-3">Показаны первые {numbers.format(maxChanges)}</span>
            </span>
            <button type="button" onClick={() => setAll(true)} className="shrink-0 rounded-full text-caption font-semibold text-accent-soft-fg hover:underline">
              Загрузить всё
            </button>
          </div>
        ) : null}
        <div data-slot="json-diff-lines" className="pb-2 font-mono text-body-xs/6 text-fg-1">
          {view === 'split' ? splitRows : pieces.map((piece) => (piece.type === 'fold' ? fold(piece) : unifiedRow(piece.line, piece.index)))}
        </div>
      </>
    );
  }

  return (
    <div data-slot="json-diff" aria-busy={loading || undefined} className={cn(card, className)} {...props}>
      <div data-slot="json-diff-header" className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-separator px-4 py-2">
        {title ? <span className="min-w-0 truncate font-mono text-body-xs/4 font-medium text-fg-1">{title}</span> : null}
        {meta ? <span className="text-caption text-fg-3">{meta}</span> : null}
        {changes && !loading ? (
          <span data-slot="json-diff-stats" className="flex gap-2.5 font-mono text-caption font-semibold">
            <span className="text-success-soft-fg">+{numbers.format(added)}</span>
            <span className="text-danger-soft-fg">−{numbers.format(removed)}</span>
          </span>
        ) : null}
        {changes && !loading ? (
          <SegmentedControl<JsonDiffView>
            aria-label="Вид сравнения"
            value={view}
            onValueChange={setChosen}
            options={[
              { value: 'split', label: 'Рядом' },
              { value: 'unified', label: 'Одной колонкой' },
            ]}
            className={cn(headerSegmented, 'ml-auto')}
          />
        ) : null}
      </div>
      {content}
    </div>
  );
}
