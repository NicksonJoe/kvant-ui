/**
 * Document model of RichTextEditor: blocks of inline runs, its HTML in and out, edit commands and undo history.
 * Pure functions over plain data; only the HTML readers need a DOM.
 */

export const RICH_TEXT_MARKS = ['bold', 'italic', 'underline', 'strike', 'code'] as const;
export type RichTextMark = (typeof RICH_TEXT_MARKS)[number];

export const RICH_TEXT_BLOCKS = ['paragraph', 'heading', 'bullet', 'ordered', 'quote'] as const;
export type RichTextBlockType = (typeof RICH_TEXT_BLOCKS)[number];

export interface RichTextText {
  type: 'text';
  /** «\n» is a soft line break (Shift+Enter). */
  text: string;
  marks?: readonly RichTextMark[];
  /** Only http(s), mailto and tel survive the way out (see `safeHref`). */
  href?: string;
}

export interface RichTextMention {
  type: 'mention';
  id: string;
  /** Name without «@». */
  label: string;
}

export type RichTextInline = RichTextText | RichTextMention;

export interface RichTextBlock {
  type: RichTextBlockType;
  content: readonly RichTextInline[];
}

/** The document: one block at least. Store it as JSON or as `richTextToHTML`. */
export type RichTextValue = readonly RichTextBlock[];

/** A place in the document: block index and offset in it, a mention counts as one character. */
export interface RichTextPoint {
  block: number;
  offset: number;
}

export interface RichTextSelection {
  anchor: RichTextPoint;
  focus: RichTextPoint;
}

export interface RichTextState {
  doc: RichTextValue;
  selection: RichTextSelection;
}

/** Format of typed text. */
export interface RichTextStyle {
  marks?: readonly RichTextMark[];
  href?: string;
}

// A mention is this one character in plain-text views of a block, so offsets stay the same.
const ATOM = '\uFFFC';
// control characters but tab and line breaks, and U+FFFC that stands for a mention in block strings
const CONTROL = /[^\P{Cc}\t\n\r]|\uFFFC/gu;

/* ---------- model ---------- */

export const emptyRichText = (): RichTextValue => [{ type: 'paragraph', content: [] }];

const sortMarks = (marks: readonly RichTextMark[]): RichTextMark[] => RICH_TEXT_MARKS.filter((mark) => marks.includes(mark));
const sameStyle = (a: RichTextText, b: RichTextText) => a.href === b.href && sortMarks(a.marks ?? []).join() === sortMarks(b.marks ?? []).join();

function makeText(text: string, style: RichTextStyle = {}): RichTextText {
  const marks = sortMarks(style.marks ?? []);
  return { type: 'text', text, ...(marks.length > 0 ? { marks } : {}), ...(style.href ? { href: style.href } : {}) };
}

function normalizeContent(content: readonly RichTextInline[]): RichTextInline[] {
  const out: RichTextInline[] = [];
  for (const inline of content) {
    if (inline.type === 'mention') {
      out.push({ type: 'mention', id: inline.id, label: inline.label });
      continue;
    }
    if (inline.text === '') continue;
    const previous = out.at(-1);
    if (previous?.type === 'text' && sameStyle(previous, inline)) out[out.length - 1] = makeText(previous.text + inline.text, previous);
    else out.push(makeText(inline.text, inline));
  }
  return out;
}

export function normalizeRichText(doc: RichTextValue): RichTextValue {
  const blocks = doc.map((block) => ({ type: block.type, content: normalizeContent(block.content) }));
  return blocks.length > 0 ? blocks : emptyRichText();
}

const inlineLength = (inline: RichTextInline) => (inline.type === 'text' ? inline.text.length : 1);
const blockLength = (block: RichTextBlock | undefined) => (block?.content ?? []).reduce((sum, inline) => sum + inlineLength(inline), 0);
const blockString = (block: RichTextBlock | undefined) => (block?.content ?? []).map((inline) => (inline.type === 'text' ? inline.text : ATOM)).join('');

export function richTextToPlainText(doc: RichTextValue): string {
  return doc.map((block) => block.content.map((inline) => (inline.type === 'text' ? inline.text : `@${inline.label}`)).join('')).join('\n');
}

/** Ids of the people mentioned, each once, in order. */
export function richTextMentions(doc: RichTextValue): string[] {
  return [...new Set(doc.flatMap((block) => block.content.flatMap((inline) => (inline.type === 'mention' ? [inline.id] : []))))];
}

/* ---------- links ---------- */

const PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** The address when it is absolute http(s), mailto or tel; anything else (javascript:, data:, relative) is null. */
export function safeHref(href: string): string | null {
  try {
    const url = new URL(href.trim());
    return PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** What a person types into the link field: «norda.cloud/deals/418», «ivan@norda.cloud», «+7 495 000-00-00». */
export function normalizeHref(input: string): string | null {
  const value = input.trim();
  if (value === '' || /\s/.test(value.replace(/^\+?[\d\s()-]+$/, ''))) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return safeHref(value);
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return safeHref(`mailto:${value}`);
  if (/^\+?[\d\s()-]{5,}$/.test(value)) return safeHref(`tel:${value.replace(/[^\d+]/g, '')}`);
  if (/^[^\s/]+\.[^\s/]+/.test(value)) return safeHref(`https://${value}`);
  return null;
}

/** Link text when there is no selection: the address as a person reads it. */
const hrefLabel = (href: string) => href.replace(/^(https?:\/\/|mailto:|tel:)/, '').replace(/\/$/, '');

/* ---------- HTML out ---------- */

const escapeHTML = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

const MARK_TAGS: Record<RichTextMark, string> = { bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code' };
const BLOCK_TAGS: Record<RichTextBlockType, string> = { paragraph: 'p', heading: 'h2', bullet: 'li', ordered: 'li', quote: 'p' };
const GROUP_TAGS: Partial<Record<RichTextBlockType, string>> = { bullet: 'ul', ordered: 'ol', quote: 'blockquote' };

export interface RichTextHTMLOptions {
  /** Markup for the editing surface: chips are contenteditable="false", text past `limit` is wrapped in `[data-over]`. */
  editable?: boolean;
  limit?: number;
}

/** Clean HTML of the document: only the tags below, text escaped, links checked by `safeHref`. */
export function richTextToHTML(doc: RichTextValue, options: RichTextHTMLOptions = {}): string {
  const limit = options.editable ? options.limit : undefined;
  let position = 0;
  let html = '';
  let group: RichTextBlockType | null = null;

  const textHTML = (text: string) => escapeHTML(text).replace(/\n/g, '<br>');
  const inlineHTML = (inline: RichTextInline): string => {
    if (inline.type === 'mention') {
      position += inline.label.length + 1;
      return `<span data-mention-id="${escapeHTML(inline.id)}"${options.editable ? ' contenteditable="false"' : ''}>@${escapeHTML(inline.label)}</span>`;
    }
    const start = position;
    position += inline.text.length;
    const cut = limit === undefined ? inline.text.length : Math.min(Math.max(limit - start, 0), inline.text.length);
    let inner = textHTML(inline.text.slice(0, cut)) + (cut < inline.text.length ? `<span data-over="">${textHTML(inline.text.slice(cut))}</span>` : '');
    for (const mark of [...sortMarks(inline.marks ?? [])].reverse()) inner = `<${MARK_TAGS[mark]}>${inner}</${MARK_TAGS[mark]}>`;
    const href = inline.href ? safeHref(inline.href) : null;
    return href ? `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
  };

  doc.forEach((block, index) => {
    if (index > 0) position += 1;
    const wrapper = GROUP_TAGS[block.type] ?? null;
    if (group !== block.type || wrapper === null) {
      if (group && GROUP_TAGS[group]) html += `</${GROUP_TAGS[group]}>`;
      if (wrapper) html += `<${wrapper}>`;
      group = block.type;
    }
    const text = blockString(block);
    // a trailing <br> never shows a line of its own, so an empty block or one ending in a break gets one more
    const filler = text === '' || text.endsWith('\n') ? '<br>' : '';
    const tag = BLOCK_TAGS[block.type];
    html += `<${tag}>${block.content.map(inlineHTML).join('')}${filler}</${tag}>`;
  });
  if (group && GROUP_TAGS[group]) html += `</${GROUP_TAGS[group]}>`;
  return html;
}

/* ---------- HTML in ---------- */

export interface RichTextReadOptions {
  /** Label of a known person, or undefined: unknown chips stay plain text. */
  mention?: (id: string) => string | undefined;
}

export interface RichTextDOMOptions extends RichTextReadOptions {
  /** Pasted HTML collapses spaces like a browser does; the editing surface keeps them as typed. */
  collapseWhitespace?: boolean;
  /** DOM points (the selection) to translate into document points, in the same order. */
  points?: readonly { node: Node; offset: number }[];
}

// Everything inside is dropped, text included: code, styles, embedded documents, media, form controls.
const DROP = new Set([
  'script', 'style', 'template', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'noscript', 'noembed', 'noframes',
  'head', 'title', 'meta', 'link', 'base', 'svg', 'math', 'canvas', 'video', 'audio', 'picture', 'source', 'track', 'img', 'map',
  'area', 'input', 'select', 'textarea', 'button', 'option', 'datalist', 'output', 'progress', 'meter', 'dialog', 'slot',
]);
const CONTAINERS = new Set(['ul', 'ol', 'blockquote', 'table', 'thead', 'tbody', 'tfoot', 'dl', 'menu']);
const BLOCKS = new Set([
  'p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'address', 'article', 'aside', 'section', 'header', 'footer', 'main',
  'nav', 'figure', 'figcaption', 'details', 'summary', 'fieldset', 'form', 'hgroup', 'dt', 'dd', 'tr', 'td', 'th', 'caption', 'hr',
]);
const TAG_MARKS: Record<string, RichTextMark> = {
  strong: 'bold', b: 'bold', em: 'italic', i: 'italic', u: 'underline', ins: 'underline', s: 'strike', strike: 'strike', del: 'strike',
  code: 'code', kbd: 'code', samp: 'code', tt: 'code',
};

interface Draft {
  type: RichTextBlockType;
  content: RichTextInline[];
  /** The last thing added was a <br>: a trailing one is not a line. */
  br: boolean;
}

interface Context {
  type: RichTextBlockType;
  marks: readonly RichTextMark[];
  href?: string;
  pre: boolean;
}

function styleMarks(element: Element, marks: readonly RichTextMark[]): RichTextMark[] {
  const next = new Set(marks);
  const tagMark = TAG_MARKS[element.localName];
  const style = element instanceof HTMLElement ? element.style : null;
  const weight = style?.fontWeight ?? '';
  // Google Docs wraps the whole clipboard in <b style="font-weight:normal">
  const boldOff = weight === 'normal' || (/^\d+$/.test(weight) && Number(weight) < 600);
  if (tagMark && !(tagMark === 'bold' && boldOff)) next.add(tagMark);
  if (weight === 'bold' || weight === 'bolder' || (/^\d+$/.test(weight) && Number(weight) >= 600)) next.add('bold');
  if (style?.fontStyle === 'italic') next.add('italic');
  const decoration = `${style?.textDecoration ?? ''} ${style?.textDecorationLine ?? ''}`;
  if (decoration.includes('underline')) next.add('underline');
  if (decoration.includes('line-through')) next.add('strike');
  return [...next];
}

/** Reads any DOM (the editing surface, pasted HTML) into the document: only known blocks, marks, safe links and known mentions. */
export function readRichTextDOM(root: Node, options: RichTextDOMOptions = {}): { doc: RichTextValue; points: RichTextPoint[] } {
  const blocks: Draft[] = [];
  let open: Draft | null = null;
  const points = options.points ?? [];
  const found: (RichTextPoint | null)[] = points.map(() => null);
  const collapse = options.collapseWhitespace ?? false;

  const length = (draft: Draft) => draft.content.reduce((sum, inline) => sum + inlineLength(inline), 0);
  const here = (): RichTextPoint => (open ? { block: blocks.indexOf(open), offset: length(open) } : { block: blocks.length, offset: 0 });
  const mark = (node: Node, offset: number, point: RichTextPoint) => {
    points.forEach((target, index) => {
      if (target.node === node && target.offset === offset && found[index] === null) found[index] = point;
    });
  };
  const ensure = (context: Context): Draft => {
    if (open) return open;
    open = { type: context.type, content: [], br: false };
    blocks.push(open);
    return open;
  };
  const close = () => {
    if (open && collapse) {
      const last = open.content.at(-1);
      if (last?.type === 'text' && !last.href && last.text.endsWith(' ')) open.content[open.content.length - 1] = { ...last, text: last.text.replace(/ +$/, '') };
    }
    open = null;
  };

  const addText = (raw: string, context: Context, node: Node) => {
    let text = raw.replace(CONTROL, '');
    if (collapse && !context.pre) {
      text = text.replace(/[\t\n\r\f ]+/g, ' ');
      const before = open ? blockString(open) : '';
      if (text.startsWith(' ') && (before === '' || before.endsWith(' ') || before.endsWith('\n'))) text = text.slice(1);
    }
    if (text === '') {
      points.forEach((point, index) => {
        if (point.node === node && found[index] === null) found[index] = here();
      });
      return;
    }
    const draft = ensure(context);
    const base = { block: blocks.indexOf(draft), offset: length(draft) };
    points.forEach((point, index) => {
      if (point.node === node && found[index] === null) found[index] = { block: base.block, offset: base.offset + Math.min(point.offset, text.length) };
    });
    draft.content.push(makeText(text, { marks: context.marks, href: context.href }));
    draft.br = false;
  };

  const walk = (node: Node, context: Context) => {
    if (node.nodeType === 3 /* text */) {
      addText(node.textContent ?? '', context, node);
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.localName;
    if (DROP.has(tag) || node.hasAttribute('hidden') || (node instanceof HTMLElement && node.style.display === 'none')) return;

    const mentionId = node.getAttribute('data-mention-id');
    const label = mentionId === null ? undefined : options.mention?.(mentionId);
    if (mentionId !== null && label !== undefined) {
      const draft = ensure(context);
      const before = { block: blocks.indexOf(draft), offset: length(draft) };
      draft.content.push({ type: 'mention', id: mentionId, label });
      draft.br = false;
      const after = { block: before.block, offset: before.offset + 1 };
      // a point inside the chip lands before or after it
      points.forEach((point, index) => {
        if (found[index] === null && node.contains(point.node)) found[index] = point.offset === 0 && (point.node === node || point.node === node.firstChild) ? before : after;
      });
      return;
    }

    if (tag === 'br') {
      const draft = ensure(context);
      draft.content.push(makeText('\n', { marks: context.marks, href: context.href }));
      draft.br = true;
      return;
    }

    let next: Context = context;
    const container = CONTAINERS.has(tag);
    const isBlock = BLOCKS.has(tag);
    if (container) {
      close();
      if (tag === 'ul' || tag === 'menu') next = { ...context, type: 'bullet' };
      else if (tag === 'ol') next = { ...context, type: 'ordered' };
      else if (tag === 'blockquote') next = { ...context, type: 'quote' };
    } else if (isBlock) {
      const type: RichTextBlockType = /^h[1-6]$/.test(tag) ? 'heading' : tag === 'li' ? (context.type === 'ordered' ? 'ordered' : 'bullet') : context.type;
      next = { ...context, type, pre: context.pre || tag === 'pre', marks: tag === 'pre' ? [...context.marks, 'code'] : context.marks };
      // a <p> right inside an empty <li> continues that item, a heading inside an empty <div> makes it a heading
      if (open && length(open) === 0 && !open.br) {
        if (type !== context.type) open.type = type;
      } else {
        close();
        if (tag !== 'hr') {
          open = { type, content: [], br: false };
          blocks.push(open);
        }
      }
    } else {
      const marks = styleMarks(node, context.marks);
      const href = tag === 'a' ? (safeHref(node.getAttribute('href') ?? '') ?? undefined) : context.href;
      next = { ...context, marks, href };
    }

    const children = [...node.childNodes];
    children.forEach((child, index) => {
      mark(node, index, here());
      walk(child, next);
    });
    mark(node, children.length, here());
    if (container || isBlock) close();
  };

  const top: Context = { type: 'paragraph', marks: [], pre: false };
  const children = [...(root instanceof Document ? root.body.childNodes : root.childNodes)];
  children.forEach((child, index) => {
    mark(root, index, here());
    walk(child, top);
  });
  mark(root, children.length, here());

  for (const draft of blocks) {
    const last = draft.content.at(-1);
    if (draft.br && last?.type === 'text') draft.content[draft.content.length - 1] = { ...last, text: last.text.slice(0, -1) };
  }
  const doc = normalizeRichText(blocks.map((draft) => ({ type: draft.type, content: draft.content })));
  const clamp = (point: RichTextPoint | null): RichTextPoint => {
    if (!point || point.block >= doc.length) return { block: doc.length - 1, offset: blockLength(doc.at(-1)) };
    return { block: point.block, offset: Math.min(point.offset, blockLength(doc[point.block])) };
  };
  return { doc, points: found.map(clamp) };
}

/** Pasted or stored HTML → document. The markup is parsed inert (DOMParser runs no scripts and loads nothing) and only text survives. */
export function parseRichTextHTML(html: string, options: RichTextReadOptions = {}): RichTextValue {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return readRichTextDOM(parsed, { ...options, collapseWhitespace: true }).doc;
}

/** Plain text → paragraphs, one per line. */
export function plainTextToRichText(text: string): RichTextValue {
  return normalizeRichText(text.replace(CONTROL, '').split(/\r\n|\r|\n/).map((line) => ({ type: 'paragraph', content: [makeText(line)] })));
}

/* ---------- editing ---------- */

/** The nearest point that exists in `doc`. */
export function clampPoint(doc: RichTextValue, point: RichTextPoint): RichTextPoint {
  const block = Math.min(Math.max(point.block, 0), doc.length - 1);
  return { block, offset: Math.min(Math.max(point.offset, 0), blockLength(doc[block])) };
}

export const comparePoints = (a: RichTextPoint, b: RichTextPoint) => a.block - b.block || a.offset - b.offset;
const ordered = (selection: RichTextSelection): [RichTextPoint, RichTextPoint] =>
  comparePoints(selection.anchor, selection.focus) <= 0 ? [selection.anchor, selection.focus] : [selection.focus, selection.anchor];
const caretAt = (point: RichTextPoint): RichTextSelection => ({ anchor: point, focus: point });
export const isCollapsed = (selection: RichTextSelection) => comparePoints(selection.anchor, selection.focus) === 0;

/** Content of a block between two offsets, runs cut where needed. */
function sliceContent(content: readonly RichTextInline[], from: number, to: number): RichTextInline[] {
  const out: RichTextInline[] = [];
  let position = 0;
  for (const inline of content) {
    const start = position;
    position += inlineLength(inline);
    if (position <= from || start >= to) continue;
    if (inline.type === 'mention') out.push(inline);
    else out.push({ ...inline, text: inline.text.slice(Math.max(from - start, 0), Math.min(to - start, inline.text.length)) });
  }
  return out;
}

const withBlock = (doc: RichTextValue, index: number, block: RichTextBlock): RichTextValue => doc.map((item, position) => (position === index ? block : item));

/** Text runs of [from, to) mapped by `change`; everything else as it was. */
function mapRange(doc: RichTextValue, from: RichTextPoint, to: RichTextPoint, change: (text: RichTextText) => RichTextText): RichTextValue {
  return normalizeRichText(
    doc.map((block, index) => {
      if (index < from.block || index > to.block) return block;
      const start = index === from.block ? from.offset : 0;
      const end = index === to.block ? to.offset : blockLength(block);
      const middle = sliceContent(block.content, start, end).map((inline) => (inline.type === 'text' ? change(inline) : inline));
      return { type: block.type, content: [...sliceContent(block.content, 0, start), ...middle, ...sliceContent(block.content, end, Infinity)] };
    }),
  );
}

export function sliceRichText(doc: RichTextValue, selection: RichTextSelection): RichTextValue {
  const [from, to] = ordered(selection);
  return normalizeRichText(
    doc.slice(from.block, to.block + 1).map((block, index) => {
      const blockIndex = from.block + index;
      return { type: block.type, content: sliceContent(block.content, blockIndex === from.block ? from.offset : 0, blockIndex === to.block ? to.offset : Infinity) };
    }),
  );
}

export const selectionText = (doc: RichTextValue, selection: RichTextSelection) => richTextToPlainText(sliceRichText(doc, selection));

export function deleteSelection(state: RichTextState): RichTextState {
  const [from, to] = ordered(state.selection);
  if (comparePoints(from, to) === 0) return { doc: state.doc, selection: caretAt(from) };
  const first = state.doc[from.block];
  const last = state.doc[to.block];
  if (!first || !last) return state;
  const merged: RichTextBlock = { type: first.type, content: [...sliceContent(first.content, 0, from.offset), ...sliceContent(last.content, to.offset, Infinity)] };
  const doc = normalizeRichText([...state.doc.slice(0, from.block), merged, ...state.doc.slice(to.block + 1)]);
  return { doc, selection: caretAt(from) };
}

/** Format typing continues with: marks of the character before; a link and inline code only from inside them. */
export function inheritedStyle(doc: RichTextValue, point: RichTextPoint): RichTextStyle {
  const content = doc[point.block]?.content ?? [];
  const before = sliceContent(content, point.offset - 1, point.offset)[0];
  const after = sliceContent(content, point.offset, point.offset + 1)[0];
  const source = before ?? after;
  if (source?.type !== 'text') return {};
  const inside = (test: (inline: RichTextText) => boolean) => before?.type === 'text' && after?.type === 'text' && test(before) && test(after);
  const marks = (source.marks ?? []).filter((mark) => mark !== 'code' || inside((inline) => inline.marks?.includes('code') === true));
  const href = before?.type === 'text' && before.href && inside((inline) => inline.href === before.href) ? before.href : undefined;
  return { marks, ...(href ? { href } : {}) };
}

export function insertFragment(state: RichTextState, fragment: RichTextValue): RichTextState {
  const cleared = deleteSelection(state);
  const point = cleared.selection.focus;
  const current = cleared.doc[point.block];
  const pieces = normalizeRichText(fragment);
  const firstPiece = pieces[0];
  const lastPiece = pieces.at(-1);
  if (!current || !firstPiece || !lastPiece) return cleared;
  const left = sliceContent(current.content, 0, point.offset);
  const right = sliceContent(current.content, point.offset, Infinity);
  // an empty block takes a heading, list or quote pasted into it; plain text and a filled block keep their own type
  const headType = blockLength(current) === 0 && firstPiece.type !== 'paragraph' ? firstPiece.type : current.type;
  if (pieces.length === 1) {
    const doc = withBlock(cleared.doc, point.block, { type: headType, content: normalizeContent([...left, ...firstPiece.content, ...right]) });
    return { doc, selection: caretAt({ block: point.block, offset: point.offset + blockLength(firstPiece) }) };
  }
  const head: RichTextBlock = { type: headType, content: [...left, ...firstPiece.content] };
  const tail: RichTextBlock = { type: lastPiece.type, content: [...lastPiece.content, ...right] };
  const doc = normalizeRichText([...cleared.doc.slice(0, point.block), head, ...pieces.slice(1, -1), tail, ...cleared.doc.slice(point.block + 1)]);
  return { doc, selection: caretAt({ block: point.block + pieces.length - 1, offset: blockLength(lastPiece) }) };
}

/** Inline content dropped into the caret block as it is: the block keeps its type even when empty. */
function insertInline(state: RichTextState, content: readonly RichTextInline[]): RichTextState {
  const type = state.doc[state.selection.focus.block]?.type ?? 'paragraph';
  return insertFragment(state, [{ type, content }]);
}

export function insertText(state: RichTextState, text: string, style?: RichTextStyle): RichTextState {
  const cleared = deleteSelection(state);
  const format = style ?? inheritedStyle(cleared.doc, cleared.selection.focus);
  return insertInline(cleared, [makeText(text.replace(CONTROL, ''), format)]);
}

const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ru', { granularity: 'grapheme' }) : null;

/** Length of the character (grapheme) right before `offset`: «👍🏽» is four code units. */
function graphemeBefore(text: string, offset: number): number {
  if (!segmenter) return Math.min(offset, 1);
  let size = 0;
  for (const segment of segmenter.segment(text.slice(0, offset))) size = segment.segment.length;
  return size;
}

function graphemeAfter(text: string, offset: number): number {
  if (!segmenter) return Math.min(text.length - offset, 1);
  const first = segmenter.segment(text.slice(offset))[Symbol.iterator]().next();
  return first.done ? 0 : first.value.segment.length;
}

export type RichTextDeleteUnit = 'char' | 'word';

export function deleteBackward(state: RichTextState, unit: RichTextDeleteUnit): RichTextState {
  if (!isCollapsed(state.selection)) return deleteSelection(state);
  const point = state.selection.focus;
  const block = state.doc[point.block];
  if (!block) return state;
  if (point.offset === 0) {
    if (block.type !== 'paragraph') return { doc: withBlock(state.doc, point.block, { type: 'paragraph', content: block.content }), selection: state.selection };
    const previous = state.doc[point.block - 1];
    if (!previous) return state;
    return deleteSelection({ doc: state.doc, selection: { anchor: { block: point.block - 1, offset: blockLength(previous) }, focus: point } });
  }
  const text = blockString(block);
  const size = unit === 'word' ? (/\S*\s*$/.exec(text.slice(0, point.offset))?.[0].length ?? 0) || 1 : graphemeBefore(text, point.offset);
  return deleteSelection({ doc: state.doc, selection: { anchor: { block: point.block, offset: point.offset - size }, focus: point } });
}

export function deleteForward(state: RichTextState, unit: RichTextDeleteUnit): RichTextState {
  if (!isCollapsed(state.selection)) return deleteSelection(state);
  const point = state.selection.focus;
  const block = state.doc[point.block];
  if (!block) return state;
  const text = blockString(block);
  if (point.offset >= text.length) {
    if (!state.doc[point.block + 1]) return state;
    return deleteSelection({ doc: state.doc, selection: { anchor: point, focus: { block: point.block + 1, offset: 0 } } });
  }
  const size = unit === 'word' ? (/^\s*\S*/.exec(text.slice(point.offset))?.[0].length ?? 0) || 1 : graphemeAfter(text, point.offset);
  return deleteSelection({ doc: state.doc, selection: { anchor: point, focus: { block: point.block, offset: point.offset + size } } });
}

/** Enter: a new block of the same kind; an empty list item or quote leaves to text, a heading continues with text. */
export function splitBlock(state: RichTextState): RichTextState {
  const cleared = deleteSelection(state);
  const point = cleared.selection.focus;
  const block = cleared.doc[point.block];
  if (!block) return cleared;
  const length = blockLength(block);
  if (length === 0 && block.type !== 'paragraph' && block.type !== 'heading') {
    return { doc: withBlock(cleared.doc, point.block, { type: 'paragraph', content: [] }), selection: cleared.selection };
  }
  const nextType: RichTextBlockType = block.type === 'heading' && point.offset === length ? 'paragraph' : block.type;
  const doc = normalizeRichText([
    ...cleared.doc.slice(0, point.block),
    { type: block.type, content: sliceContent(block.content, 0, point.offset) },
    { type: nextType, content: sliceContent(block.content, point.offset, Infinity) },
    ...cleared.doc.slice(point.block + 1),
  ]);
  return { doc, selection: caretAt({ block: point.block + 1, offset: 0 }) };
}

const textRuns = (doc: RichTextValue, selection: RichTextSelection) =>
  sliceRichText(doc, selection).flatMap((block) => block.content.filter((inline): inline is RichTextText => inline.type === 'text' && inline.text !== '\n'));

/** Adds the mark to the whole range, or removes it when all of the range already has it. A collapsed caret is left alone. */
export function toggleMark(state: RichTextState, mark: RichTextMark): RichTextState {
  if (isCollapsed(state.selection)) return state;
  const [from, to] = ordered(state.selection);
  const runs = textRuns(state.doc, state.selection);
  const on = runs.length > 0 && runs.every((run) => run.marks?.includes(mark));
  const doc = mapRange(state.doc, from, to, (run) =>
    makeText(run.text, { href: run.href, marks: on ? (run.marks ?? []).filter((item) => item !== mark) : [...(run.marks ?? []), mark] }),
  );
  return { doc, selection: state.selection };
}

export function setBlockType(state: RichTextState, type: RichTextBlockType): RichTextState {
  const [from, to] = ordered(state.selection);
  return { doc: state.doc.map((block, index) => (index >= from.block && index <= to.block ? { type, content: block.content } : block)), selection: state.selection };
}

/** Toolbar list, heading and quote buttons: on for every block of the selection, off when they all are already. */
export function toggleBlockType(state: RichTextState, type: RichTextBlockType): RichTextState {
  const [from, to] = ordered(state.selection);
  const all = state.doc.slice(from.block, to.block + 1).every((block) => block.type === type);
  return setBlockType(state, all ? 'paragraph' : type);
}

/** The whole link the point touches (inside, at its end or right before it) and its address. */
function linkSpan(doc: RichTextValue, point: RichTextPoint): { selection: RichTextSelection; href: string } | null {
  let position = 0;
  const spans = (doc[point.block]?.content ?? []).map((inline) => {
    const start = position;
    position += inlineLength(inline);
    return { start, end: position, href: inline.type === 'text' ? inline.href : undefined };
  });
  const span =
    spans.find((item) => item.href && point.offset > item.start && point.offset <= item.end) ?? spans.find((item) => item.href && point.offset === item.start);
  if (!span?.href) return null;
  return { selection: { anchor: { block: point.block, offset: span.start }, focus: { block: point.block, offset: span.end } }, href: span.href };
}

export const linkRange = (doc: RichTextValue, point: RichTextPoint): RichTextSelection | null => linkSpan(doc, point)?.selection ?? null;

/**
 * Link on the selection; null removes it. A caret inside a link changes that whole link; a caret elsewhere inserts the
 * address as the link text.
 */
export function setLink(state: RichTextState, href: string | null): RichTextState {
  let selection = state.selection;
  if (isCollapsed(selection)) {
    const around = linkRange(state.doc, selection.focus);
    if (around) selection = around;
    else if (href) return insertText(state, hrefLabel(href), { ...inheritedStyle(state.doc, selection.focus), href });
    else return state;
  }
  const [from, to] = ordered(selection);
  const doc = mapRange(state.doc, from, to, (run) => makeText(run.text, { marks: run.marks, ...(href ? { href } : {}) }));
  return { doc, selection: state.selection };
}

/** Replaces the «@query» between `from` and the caret with the chip and a space. */
export function insertMention(state: RichTextState, from: RichTextPoint, person: { id: string; label: string }): RichTextState {
  const replaced = deleteSelection({ doc: state.doc, selection: { anchor: from, focus: state.selection.focus } });
  return insertInline(replaced, [{ type: 'mention', id: person.id, label: person.label }, makeText(' ')]);
}

export interface RichTextFormat {
  marks: RichTextMark[];
  block: RichTextBlockType;
  /** Link the caret or the whole selection is in. */
  href?: string;
}

/** What the toolbar shows as on. */
export function formatAt(state: RichTextState): RichTextFormat {
  const focus = state.selection.focus;
  const block = state.doc[focus.block]?.type ?? 'paragraph';
  if (isCollapsed(state.selection)) {
    const href = linkSpan(state.doc, focus)?.href;
    return { marks: [...(inheritedStyle(state.doc, focus).marks ?? [])], block, ...(href ? { href } : {}) };
  }
  const runs = textRuns(state.doc, state.selection);
  const marks = RICH_TEXT_MARKS.filter((mark) => runs.length > 0 && runs.every((run) => run.marks?.includes(mark)));
  const first = runs[0]?.href;
  return { marks, block, ...(first && runs.every((run) => run.href === first) ? { href: first } : {}) };
}

/** Plain text of the caret block before the caret (mentions as U+FFFC): where «@» and «/» queries are read. */
export function textBeforeCaret(state: RichTextState): string {
  const focus = state.selection.focus;
  return blockString(state.doc[focus.block]).slice(0, focus.offset);
}

/* ---------- history ---------- */

export type RichTextEditKind = 'insert' | 'delete' | 'other';

export interface RichTextHistoryEntry {
  state: RichTextState;
  kind: RichTextEditKind;
  time: number;
}

export interface RichTextHistory {
  undo: readonly RichTextHistoryEntry[];
  redo: readonly RichTextHistoryEntry[];
}

const HISTORY_LIMIT = 100;
const GROUP_MS = 1000;

export const createRichTextHistory = (): RichTextHistory => ({ undo: [], redo: [] });

/** Remembers the state before an edit. Typing (or deleting) without a 1 s pause is one step. */
export function recordRichTextHistory(history: RichTextHistory, before: RichTextState, kind: RichTextEditKind, now = Date.now()): RichTextHistory {
  const last = history.undo.at(-1);
  if (last && kind !== 'other' && last.kind === kind && now - last.time < GROUP_MS) {
    return { undo: [...history.undo.slice(0, -1), { ...last, time: now }], redo: [] };
  }
  return { undo: [...history.undo, { state: before, kind, time: now }].slice(-HISTORY_LIMIT), redo: [] };
}

/** Ends the current typing step: the next edit starts a new one. */
export function sealRichTextHistory(history: RichTextHistory): RichTextHistory {
  const last = history.undo.at(-1);
  return last && last.time !== -Infinity ? { undo: [...history.undo.slice(0, -1), { ...last, time: -Infinity }], redo: history.redo } : history;
}

export function undoRichText(history: RichTextHistory, current: RichTextState): { history: RichTextHistory; state: RichTextState } | null {
  const last = history.undo.at(-1);
  if (!last) return null;
  return { history: { undo: history.undo.slice(0, -1), redo: [...history.redo, { state: current, kind: 'other', time: 0 }] }, state: last.state };
}

export function redoRichText(history: RichTextHistory, current: RichTextState): { history: RichTextHistory; state: RichTextState } | null {
  const last = history.redo.at(-1);
  if (!last) return null;
  return { history: { undo: [...history.undo, { state: current, kind: 'other', time: 0 }], redo: history.redo.slice(0, -1) }, state: last.state };
}
