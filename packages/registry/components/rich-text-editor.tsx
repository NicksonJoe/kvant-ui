import {
  ArrowUp,
  AtSign,
  Bold,
  Check,
  ChevronDown,
  CircleAlert,
  CircleX,
  Code,
  Ellipsis,
  Heading1,
  Italic,
  Link,
  List,
  ListOrdered,
  Lock,
  Paperclip,
  Pilcrow,
  Redo2,
  Strikethrough,
  TextQuote,
  Trash,
  Underline,
  Undo2,
} from 'lucide-react';
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import {
  RICH_TEXT_BLOCKS,
  clampPoint,
  comparePoints,
  createRichTextHistory,
  deleteBackward,
  deleteForward,
  deleteSelection,
  emptyRichText,
  formatAt,
  inheritedStyle,
  insertFragment,
  insertMention,
  insertText,
  isCollapsed,
  normalizeHref,
  normalizeRichText,
  parseRichTextHTML,
  plainTextToRichText,
  readRichTextDOM,
  recordRichTextHistory,
  redoRichText,
  richTextToHTML,
  sealRichTextHistory,
  richTextToPlainText,
  selectionText,
  setBlockType,
  setLink,
  sliceRichText,
  splitBlock,
  textBeforeCaret,
  toggleBlockType,
  toggleMark,
  undoRichText,
  type RichTextBlockType,
  type RichTextEditKind,
  type RichTextMark,
  type RichTextPoint,
  type RichTextSelection,
  type RichTextState,
  type RichTextValue,
} from '../lib/rich-text';
import { FocusGroup, focusRing } from './focus-management';
import { MentionSuggestions, matchMentionPeople, mentionQuery, type MentionPerson } from './mention-field';
import { Menu, MenuCheckboxItem, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from './menu';
import { Tooltip } from './popover';
import { Portal } from './portal';

export {
  emptyRichText,
  parseRichTextHTML,
  plainTextToRichText,
  richTextMentions,
  richTextToHTML,
  richTextToPlainText,
} from '../lib/rich-text';
export type { RichTextBlock, RichTextBlockType, RichTextInline, RichTextMark, RichTextMention, RichTextText, RichTextValue } from '../lib/rich-text';

export type RichTextEditorVariant = 'full' | 'compact';

/** What `selectionActions` gets: the selected text and a way to replace it (e.g. with an improved wording). */
export interface RichTextSelectionActions {
  text: string;
  replace: (text: string) => void;
}

export interface RichTextEditorProps {
  value?: RichTextValue;
  defaultValue?: RichTextValue;
  onValueChange?: (value: RichTextValue) => void;
  /** full: toolbar on top, footer with status and counter · compact: a comment field, one line at rest, formats below. */
  variant?: RichTextEditorVariant;
  /** Visible name above the field; or pass `aria-label` / `aria-labelledby`. */
  label?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
  placeholder?: string;
  /** Height of the text area in lines before it grows (full variant). */
  minRows?: number;
  /** Soft limit: counter «318 / 2 000», amber from 90 %, red and the part past it underlined above. Text is never cut. */
  maxLength?: number;
  /** Left side of the footer: a `RichTextEditorStatus`. */
  status?: ReactNode;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** People «@» can mention. */
  people?: readonly MentionPerson[];
  /** Extra buttons at the end of the selection menu, e.g. «Улучшить». */
  selectionActions?: (selection: RichTextSelectionActions) => ReactNode;
  /** Compact: ⌘Enter and the send button. */
  onSubmit?: (value: RichTextValue) => void;
  /** Compact: text on the send button instead of the arrow, e.g. «Сохранить». */
  submitLabel?: string;
  /** Compact: shows the paperclip. */
  onAttach?: () => void;
  className?: string;
}

const BLOCK_LABELS: Record<RichTextBlockType, string> = {
  paragraph: 'Обычный текст',
  heading: 'Заголовок',
  bullet: 'Маркированный список',
  ordered: 'Нумерованный список',
  quote: 'Цитата',
};
const BLOCK_ICONS: Record<RichTextBlockType, ReactElement> = {
  paragraph: <Pilcrow aria-hidden />,
  heading: <Heading1 aria-hidden />,
  bullet: <List aria-hidden />,
  ordered: <ListOrdered aria-hidden />,
  quote: <TextQuote aria-hidden />,
};
const BLOCK_SHORTCUTS: Partial<Record<RichTextBlockType, string>> = { bullet: '⇧⌘8', ordered: '⇧⌘7' };

interface MarkTool {
  mark: RichTextMark;
  label: string;
  icon: ReactElement;
  shortcut?: string;
}
const MARKS: Record<RichTextMark, MarkTool> = {
  bold: { mark: 'bold', label: 'Жирный', icon: <Bold aria-hidden />, shortcut: '⌘B' },
  italic: { mark: 'italic', label: 'Курсив', icon: <Italic aria-hidden />, shortcut: '⌘I' },
  underline: { mark: 'underline', label: 'Подчёркнутый', icon: <Underline aria-hidden />, shortcut: '⌘U' },
  strike: { mark: 'strike', label: 'Зачёркнутый', icon: <Strikethrough aria-hidden /> },
  code: { mark: 'code', label: 'Код', icon: <Code aria-hidden /> },
};

const LINE = 20;
const COMPACT_LINES = 6;
// Below 560 the toolbar keeps B I • link and moves the rest into «⋯» (class names stay literal for Tailwind).
const NARROW_HIDDEN = '@max-[560px]:hidden';

const plural = new Intl.PluralRules('ru');
const charWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'символ', few: 'символа' };
const chars = (count: number) => `${count} ${charWords[plural.select(count)] ?? 'символов'}`;
const numbers = new Intl.NumberFormat('ru-RU');

const toolLook = cn(
  'inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-fg-2 transition-[background-color,color] duration-(--duration-micro) ease-hover',
  'hover:not-aria-pressed:bg-fill-1 hover:text-fg-1 active:not-aria-pressed:bg-fill-3 aria-pressed:bg-fill-2 aria-pressed:text-fg-1 aria-pressed:[&_svg]:stroke-[2.25]!',
  'disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:stroke-[1.75]',
  focusRing.outside,
);

/* ---------- surface DOM ---------- */

/** Block elements of the canonical surface, in document order. */
function blockElements(root: HTMLElement): Element[] {
  return [...root.children].flatMap((child) => (/^(UL|OL|BLOCKQUOTE)$/.test(child.tagName) ? [...child.children] : [child]));
}

/** Units of a block: text nodes, mention chips and <br>, the way the model counts them. */
function leaves(block: Element): Node[] {
  const out: Node[] = [];
  const walk = (node: Node) => {
    for (const child of node.childNodes) {
      if (child instanceof Text) out.push(child);
      else if (child instanceof HTMLElement && (child.dataset.mentionId !== undefined || child.tagName === 'BR')) out.push(child);
      else walk(child);
    }
  };
  walk(block);
  return out;
}

function locate(root: HTMLElement, point: RichTextPoint): { node: Node; offset: number } {
  const block = blockElements(root)[point.block];
  if (!block) return { node: root, offset: root.childNodes.length };
  let left = point.offset;
  for (const leaf of leaves(block)) {
    if (leaf instanceof Text) {
      if (left <= leaf.length) return { node: leaf, offset: left };
      left -= leaf.length;
    } else {
      const parent = leaf.parentNode;
      if (left === 0 && parent) return { node: parent, offset: [...parent.childNodes].indexOf(leaf as ChildNode) };
      left -= 1;
    }
  }
  return { node: block, offset: block.childNodes.length };
}

function placeSelection(root: HTMLElement, selection: RichTextSelection) {
  const anchor = locate(root, selection.anchor);
  const focus = locate(root, selection.focus);
  document.getSelection()?.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
}

/** Brings `target` to the markup of `source` touching only what differs, so the caret and spellcheck survive. */
function patch(target: Node, source: Node) {
  const next = [...source.childNodes];
  next.forEach((node, index) => {
    const current = target.childNodes[index];
    if (!current) target.appendChild(node);
    else if (current instanceof Text && node instanceof Text) {
      if (current.data !== node.data) current.data = node.data;
    } else if (current instanceof Element && node instanceof Element && current.tagName === node.tagName) {
      for (const attribute of [...current.attributes]) if (!node.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
      for (const attribute of [...node.attributes]) if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
      patch(current, node);
    } else target.replaceChild(node, current);
  });
  while (target.childNodes.length > next.length) target.lastChild?.remove();
}

function morph(root: HTMLElement, html: string) {
  // our own escaped markup, parsed inert in a template
  const template = document.createElement('template');
  template.innerHTML = html;
  patch(root, template.content);
}

const sameDoc = (a: RichTextValue, b: RichTextValue) => a === b || JSON.stringify(a) === JSON.stringify(b);
const sameSelection = (a: RichTextSelection, b: RichTextSelection) => JSON.stringify(a) === JSON.stringify(b);
const isBlockType = (value: unknown): value is RichTextBlockType => RICH_TEXT_BLOCKS.some((type) => type === value);

function rangeRect(range: Range): DOMRect | null {
  if (typeof range.getBoundingClientRect !== 'function') return null;
  const rect = range.getBoundingClientRect();
  // a collapsed range at a line start has no box; the line's first rect does
  if (rect.width === 0 && rect.height === 0) return range.getClientRects()[0] ?? null;
  return rect;
}

/* ---------- parts ---------- */

interface ToolProps {
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  onRun: () => void;
  className?: string;
  children: ReactNode;
}

function Tool({ label, shortcut, pressed, disabled, onRun, className, children }: ToolProps) {
  return (
    <Tooltip content={label} shortcut={shortcut} disabled={disabled}>
      <button
        type="button"
        data-slot="rich-text-editor-tool"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        // keep the selection in the text
        onMouseDown={(event) => event.preventDefault()}
        onClick={onRun}
        className={cn(toolLook, className)}
      >
        {children}
      </button>
    </Tooltip>
  );
}

const Divider = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn('mx-1.5 h-4 w-px shrink-0 bg-border', className)} />
);

interface SelectionActionsProps {
  render: (selection: RichTextSelectionActions) => ReactNode;
  text: string;
  onReplace: (text: string) => void;
}

function SelectionActions({ render, text, onReplace }: SelectionActionsProps) {
  return render({ text, replace: onReplace });
}

export type RichTextEditorStatusState = 'saved' | 'saving' | 'error' | 'locked';

export interface RichTextEditorStatusProps {
  state: RichTextEditorStatusState;
  /** «Сохранено в 14:32», «Сохраняем…», «Не сохранилось · нет сети», «Сделка закрыта · правка недоступна». */
  children: ReactNode;
  /** error: shows «Повторить». */
  onRetry?: () => void;
  className?: string;
}

/** Footer status of the editor: saved ✓, saving (ring), failed with «Повторить», locked. Read out politely. */
export function RichTextEditorStatus({ state, children, onRetry, className }: RichTextEditorStatusProps) {
  return (
    <span
      data-slot="rich-text-editor-status"
      data-state={state}
      role="status"
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-caption text-fg-3 data-[state=error]:text-danger-soft-fg [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
        className,
      )}
    >
      {state === 'saved' ? <Check aria-hidden className="stroke-2! text-success-soft-fg" /> : null}
      {state === 'saving' ? (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" strokeWidth={2.5} strokeLinecap="round" className="animate-spinner stroke-[2.5]!">
          <circle cx="12" cy="12" r="9" className="stroke-fill-3" />
          <path d="M12 3a9 9 0 0 1 9 9" className="stroke-fg-3" />
        </svg>
      ) : null}
      {state === 'error' ? <CircleAlert aria-hidden /> : null}
      {state === 'locked' ? <Lock aria-hidden /> : null}
      <span className="truncate">{children}</span>
      {state === 'error' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn('rounded-xs pl-1 font-medium text-accent-soft-fg transition-colors duration-(--duration-micro) ease-hover hover:text-accent-hover', focusRing.outside)}
        >
          Повторить
        </button>
      ) : null}
    </span>
  );
}

/* ---------- editor ---------- */

interface Query {
  kind: 'mention' | 'block';
  text: string;
  from: RichTextPoint;
}

interface LinkEdit {
  selection: RichTextSelection;
  value: string;
  existing: boolean;
  invalid: boolean;
}

interface View {
  state: RichTextState;
  /** Marks switched on at a collapsed caret, waiting for the next character. */
  pending: readonly RichTextMark[] | null;
  canUndo: boolean;
  canRedo: boolean;
  composing: boolean;
  pointerDown: boolean;
  /** The «@» or «/» query closed with Esc. */
  dismissed: string | null;
}

// the text is part of the key: Esc closes the list until the query changes, like MentionField
const queryKey = (query: Query) => `${query.kind}:${query.from.block}:${query.from.offset}:${query.text}`;

/**
 * Formatted text for deal descriptions, client notes and comments: a document of blocks (text, heading, lists, quote)
 * with bold, italic, underline, strike, links, inline code and @mentions. Typing, Enter, Backspace, paste and undo go
 * through the document model; the browser only draws it, IME composition aside.
 */
export function RichTextEditor({
  value,
  defaultValue,
  onValueChange,
  variant = 'full',
  label,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  id,
  placeholder,
  minRows = 4,
  maxLength,
  status,
  readOnly = false,
  disabled = false,
  invalid = false,
  people,
  selectionActions,
  onSubmit,
  submitLabel,
  onAttach,
  className,
}: RichTextEditorProps) {
  const ids = useId();
  const editorId = id ?? `${ids}editor`;
  const labelId = `${ids}label`;
  const listId = `${ids}list`;
  const errorId = `${ids}error`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [first] = useState<RichTextState>(() => ({ doc: normalizeRichText(value ?? defaultValue ?? emptyRichText()), selection: { anchor: { block: 0, offset: 0 }, focus: { block: 0, offset: 0 } } }));
  const model = useRef(first);
  const history = useRef(createRichTextHistory());
  const pending = useRef<readonly RichTextMark[] | null>(null);
  const composing = useRef(false);
  const emitted = useRef<RichTextValue | undefined>(value);
  const dismissed = useRef<string | null>(null);
  const pointerDown = useRef(false);
  const [view, setView] = useState<View>(() => ({ state: first, pending: null, canUndo: false, canRedo: false, composing: false, pointerDown: false, dismissed: null }));
  const [focused, setFocused] = useState(false);
  const [linkEdit, setLinkEdit] = useState<LinkEdit | null>(null);
  const [active, setActive] = useState({ key: '', index: 0 });
  const [height, setHeight] = useState(LINE);
  const editable = !readOnly && !disabled;
  const compact = variant === 'compact';

  // Render reads this snapshot; handlers read and write the refs.
  const sync = () =>
    setView({
      state: model.current,
      pending: pending.current,
      canUndo: history.current.undo.length > 0,
      canRedo: history.current.redo.length > 0,
      composing: composing.current,
      pointerDown: pointerDown.current,
      dismissed: dismissed.current,
    });

  const mentionLabel = (mentionId: string): string | undefined => {
    for (const block of model.current.doc) for (const inline of block.content) if (inline.type === 'mention' && inline.id === mentionId) return inline.label;
    return people?.find((person) => person.id === mentionId)?.name;
  };

  const paint = () => {
    const root = editorRef.current;
    if (!root || composing.current) return;
    morph(root, richTextToHTML(model.current.doc, { editable: true, limit: maxLength }));
    if (document.activeElement === root) placeSelection(root, model.current.selection);
  };

  const readSelection = (): RichTextSelection => {
    const root = editorRef.current;
    const selection = document.getSelection();
    const anchor = selection?.anchorNode;
    const focus = selection?.focusNode;
    if (!root || !selection || !anchor || !focus || !root.contains(anchor) || !root.contains(focus)) return model.current.selection;
    const read = readRichTextDOM(root, {
      points: [
        { node: anchor, offset: selection.anchorOffset },
        { node: focus, offset: selection.focusOffset },
      ],
      mention: mentionLabel,
    });
    const [start, end] = read.points;
    return start && end ? { anchor: start, focus: end } : model.current.selection;
  };

  const current = (): RichTextState => ({ doc: model.current.doc, selection: readSelection() });

  const emit = (doc: RichTextValue) => {
    emitted.current = doc;
    onValueChange?.(doc);
  };

  const commit = (next: RichTextState, kind: RichTextEditKind) => {
    const before = model.current;
    const changed = !sameDoc(next.doc, before.doc);
    // joining or unwrapping blocks is its own undo step even in the middle of typing
    const structural = next.doc.length !== before.doc.length || next.doc.some((block, index) => block.type !== before.doc[index]?.type);
    if (changed) history.current = recordRichTextHistory(history.current, before, structural ? 'other' : kind);
    model.current = changed ? next : { doc: before.doc, selection: next.selection };
    pending.current = null;
    paint();
    if (changed) emit(next.doc);
    sync();
  };

  const restore = (next: RichTextState) => {
    const changed = !sameDoc(next.doc, model.current.doc);
    model.current = next;
    pending.current = null;
    paint();
    if (changed) emit(next.doc);
    sync();
  };

  const focusEditor = () => {
    const root = editorRef.current;
    if (!root || !editable) return;
    if (document.activeElement !== root) {
      root.focus({ preventScroll: true });
      placeSelection(root, model.current.selection);
    }
  };

  /** Runs a command on the selection the person sees (saved while focus was in the toolbar) and returns focus to the text. */
  const run = (change: (state: RichTextState) => RichTextState) => {
    if (!editable) return;
    const state = current();
    model.current = state;
    focusEditor();
    commit(change(state), 'other');
  };

  const toggle = (mark: RichTextMark) => {
    if (!editable) return;
    const state = current();
    model.current = state;
    focusEditor();
    if (isCollapsed(state.selection)) {
      // nothing selected: the mark waits for the next typed character
      const marks = pending.current ?? formatAt(state).marks;
      pending.current = marks.includes(mark) ? marks.filter((item) => item !== mark) : [...marks, mark];
      sync();
      return;
    }
    commit(toggleMark(state, mark), 'other');
  };

  const typeText = (text: string) => {
    const state = deleteSelection(current());
    const style = pending.current ? { marks: pending.current, href: inheritedStyle(state.doc, state.selection.focus).href } : undefined;
    commit(insertText(state, text, style), 'insert');
  };

  const undo = () => {
    const result = undoRichText(history.current, current());
    if (!result) return;
    history.current = result.history;
    restore(result.state);
  };

  const redo = () => {
    const result = redoRichText(history.current, current());
    if (!result) return;
    history.current = result.history;
    restore(result.state);
  };

  const reconcile = () => {
    const root = editorRef.current;
    if (!root || composing.current) return;
    const selection = document.getSelection();
    const anchor = selection?.anchorNode;
    const focus = selection?.focusNode;
    const inside = Boolean(selection && anchor && focus && root.contains(anchor) && root.contains(focus));
    const read = readRichTextDOM(root, {
      points: inside && selection && anchor && focus ? [{ node: anchor, offset: selection.anchorOffset }, { node: focus, offset: selection.focusOffset }] : [],
      mention: mentionLabel,
    });
    const [start, end] = read.points;
    const caret = start && end ? { anchor: start, focus: end } : model.current.selection;
    commit({ doc: read.doc, selection: caret }, 'insert');
  };

  /** Takes a caret the person moved into the model; such a move ends the typing step. */
  const trackSelection = () => {
    const root = editorRef.current;
    const anchor = document.getSelection()?.anchorNode;
    if (!root || !anchor || !root.contains(anchor) || composing.current) return;
    const selection = readSelection();
    if (sameSelection(selection, model.current.selection)) return;
    model.current = { doc: model.current.doc, selection };
    pending.current = null;
    history.current = sealRichTextHistory(history.current);
  };

  const openLink = () => {
    if (!editable) return;
    const state = current();
    model.current = state;
    const href = formatAt(state).href;
    setLinkEdit({ selection: state.selection, value: href ? href.replace(/^https:\/\//, '').replace(/\/$/, '') : '', existing: Boolean(href), invalid: false });
  };

  const closeLink = () => {
    setLinkEdit(null);
    focusEditor();
  };

  const applyLink = (edit: LinkEdit, remove = false) => {
    const href = remove || edit.value.trim() === '' ? null : normalizeHref(edit.value);
    if (!remove && edit.value.trim() !== '' && !href) {
      setLinkEdit({ ...edit, invalid: true });
      return;
    }
    setLinkEdit(null);
    model.current = { doc: model.current.doc, selection: edit.selection };
    focusEditor();
    commit(setLink({ doc: model.current.doc, selection: edit.selection }, href), 'other');
  };

  const insertFromClipboard = (data: DataTransfer) => {
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    const state = current();
    let fragment = html ? parseRichTextHTML(html, { mention: mentionLabel }) : null;
    if (!fragment || richTextToPlainText(fragment) === '') {
      if (!text) return;
      const type = model.current.doc[state.selection.focus.block]?.type ?? 'paragraph';
      // plain lines continue the list or quote they land in
      const keep: RichTextBlockType = type === 'heading' ? 'paragraph' : type;
      fragment = plainTextToRichText(text).map((block) => ({ type: keep, content: block.content }));
    }
    commit(insertFragment(state, fragment), 'other');
  };

  /* ----- derived view ----- */

  const state = view.state;
  const collapsed = isCollapsed(state.selection);
  const baseFormat = formatAt(state);
  const marks = collapsed && view.pending ? [...view.pending] : baseFormat.marks;
  const format = { ...baseFormat, marks };
  const inCode = marks.includes('code');
  const plain = richTextToPlainText(state.doc);
  const count = plain.length;
  const limit = maxLength === undefined ? undefined : count > maxLength ? 'over' : count >= maxLength * 0.9 ? 'near' : undefined;
  const over = limit === 'over' && maxLength !== undefined ? count - maxLength : 0;
  const empty = state.doc.length === 1 && (state.doc[0]?.content.length ?? 0) === 0;
  const { canUndo, canRedo } = view;
  const showInvalid = invalid || over > 0;
  const canSubmit = plain.trim() !== '' && over === 0 && editable;

  let query: Query | null = null;
  if (editable && focused && collapsed && !view.composing) {
    const before = textBeforeCaret(state);
    const mention = people && people.length > 0 ? mentionQuery(before) : null;
    const block = compact ? null : (/(?:^|\s)\/([\p{L}\p{N}-]*)$/u.exec(before)?.[1] ?? null);
    const text = mention ?? block;
    if (text !== null) query = { kind: mention !== null ? 'mention' : 'block', text, from: { block: state.selection.focus.block, offset: state.selection.focus.offset - text.length - 1 } };
    if (query && view.dismissed === queryKey(query)) query = null;
  }
  const mentionMatches = query?.kind === 'mention' && people ? matchMentionPeople(people, query.text) : [];
  const needle = query?.text.toLocaleLowerCase('ru') ?? '';
  const blockMatches = query?.kind === 'block' ? RICH_TEXT_BLOCKS.filter((type) => BLOCK_LABELS[type].toLocaleLowerCase('ru').includes(needle)) : [];
  const optionCount = query?.kind === 'mention' ? mentionMatches.length : blockMatches.length;
  const listOpen = query !== null && optionCount > 0;
  const activeIndex = query && active.key === queryKey(query) ? Math.min(active.index, optionCount - 1) : 0;
  const activeId = !listOpen || !query ? undefined : query.kind === 'mention' ? `${listId}-${mentionMatches[activeIndex]?.id ?? ''}` : `${listId}-${blockMatches[activeIndex] ?? ''}`;
  const menuOpen = editable && (linkEdit !== null || (focused && !collapsed && !view.pointerDown && !view.composing && !listOpen));

  const pickMention = (person: MentionPerson) => {
    if (!query) return;
    commit(insertMention(current(), query.from, { id: person.id, label: person.name }), 'other');
  };

  const pickBlock = (type: RichTextBlockType) => {
    if (!query) return;
    const now = current();
    const cleared = deleteSelection({ doc: now.doc, selection: { anchor: query.from, focus: now.selection.focus } });
    commit(setBlockType(cleared, type), 'other');
  };

  const replaceSelection = (text: string) => {
    const now = current();
    focusEditor();
    commit(insertText(now, text), 'other');
  };

  const submit = () => {
    if (canSubmit) onSubmit?.(model.current.doc);
  };

  /* ----- native events: beforeinput carries inputType, React's onBeforeInput does not ----- */

  const onBeforeInput = useEffectEvent((event: InputEvent) => {
    if (!editable) {
      event.preventDefault();
      return;
    }
    if (event.isComposing || composing.current) return;
    const type = event.inputType;
    const handled = (change: () => void) => {
      event.preventDefault();
      change();
    };
    switch (type) {
      case 'insertText':
        if (event.data) handled(() => typeText(event.data ?? ''));
        return;
      case 'insertParagraph':
        return handled(() => commit(splitBlock(current()), 'other'));
      case 'insertLineBreak':
        return handled(() => typeText('\n'));
      case 'deleteContentBackward':
        return handled(() => commit(deleteBackward(current(), 'char'), 'delete'));
      case 'deleteContentForward':
        return handled(() => commit(deleteForward(current(), 'char'), 'delete'));
      case 'deleteWordBackward':
      case 'deleteWordForward':
      case 'deleteSoftLineBackward':
      case 'deleteHardLineBackward':
      case 'deleteSoftLineForward':
      case 'deleteHardLineForward':
      case 'deleteContent':
      case 'deleteByCut':
        return handled(() => {
          const now = current();
          const root = editorRef.current;
          const target = typeof event.getTargetRanges === 'function' ? event.getTargetRanges()[0] : undefined;
          if (!isCollapsed(now.selection) || !target || !root) {
            const backward = type.endsWith('Backward');
            if (/Line/.test(type) && isCollapsed(now.selection)) {
              const focus = now.selection.focus;
              const edge = backward ? { block: focus.block, offset: 0 } : { block: focus.block, offset: Infinity };
              return commit(deleteSelection({ doc: now.doc, selection: { anchor: edge, focus } }), 'delete');
            }
            return commit(backward ? deleteBackward(now, 'word') : deleteForward(now, 'word'), 'delete');
          }
          const read = readRichTextDOM(root, {
            points: [
              { node: target.startContainer, offset: target.startOffset },
              { node: target.endContainer, offset: target.endOffset },
            ],
            mention: mentionLabel,
          });
          const [start, end] = read.points;
          commit(start && end ? deleteSelection({ doc: now.doc, selection: { anchor: start, focus: end } }) : now, 'delete');
        });
      case 'historyUndo':
        return handled(undo);
      case 'historyRedo':
        return handled(redo);
      case 'formatBold':
        return handled(() => toggle('bold'));
      case 'formatItalic':
        return handled(() => toggle('italic'));
      case 'formatUnderline':
        return handled(() => toggle('underline'));
      case 'formatStrikeThrough':
        return handled(() => toggle('strike'));
      case 'insertFromPaste':
      case 'insertFromDrop':
      case 'insertFromYank':
      case 'insertLink':
      case 'insertOrderedList':
      case 'insertUnorderedList':
      case 'insertHorizontalRule':
        // paste and drop arrive as their own events; the rest is not in this editor
        event.preventDefault();
        return;
      default:
        if (type.startsWith('format')) event.preventDefault();
    }
  });

  const onInput = useEffectEvent((event: Event) => {
    // only what beforeinput let through: spellcheck replacements, autocorrect, Android keyboards
    if ((event instanceof InputEvent && event.isComposing) || composing.current) return;
    reconcile();
  });

  const onCompositionStart = useEffectEvent(() => {
    // selectionchange may not have arrived yet for a caret moved right before the composition
    trackSelection();
    composing.current = true;
    sync();
  });

  const onCompositionEnd = useEffectEvent(() => {
    composing.current = false;
    reconcile();
  });

  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    event.preventDefault();
    if (editable && event.clipboardData) insertFromClipboard(event.clipboardData);
  });

  const onCopy = useEffectEvent((event: ClipboardEvent, cut: boolean) => {
    const now = current();
    if (isCollapsed(now.selection) || !event.clipboardData) return;
    event.preventDefault();
    const slice = sliceRichText(now.doc, now.selection);
    event.clipboardData.setData('text/html', richTextToHTML(slice));
    event.clipboardData.setData('text/plain', richTextToPlainText(slice));
    if (cut && editable) commit(deleteSelection(now), 'delete');
  });

  const onDrop = useEffectEvent((event: DragEvent) => {
    event.preventDefault();
    const root = editorRef.current;
    if (!editable || !event.dataTransfer || !root) return;
    const position = typeof document.caretPositionFromPoint === 'function' ? document.caretPositionFromPoint(event.clientX, event.clientY) : null;
    if (position && root.contains(position.offsetNode)) document.getSelection()?.collapse(position.offsetNode, position.offset);
    root.focus({ preventScroll: true });
    insertFromClipboard(event.dataTransfer);
  });

  const onSelectionChange = useEffectEvent(() => {
    const root = editorRef.current;
    const anchor = document.getSelection()?.anchorNode;
    if (!root || !anchor || !root.contains(anchor) || composing.current) return;
    trackSelection();
    sync();
  });

  const onPointerUp = useEffectEvent(() => {
    if (!pointerDown.current) return;
    pointerDown.current = false;
    sync();
  });

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return undefined;
    const copy = (event: ClipboardEvent) => onCopy(event, false);
    const cut = (event: ClipboardEvent) => onCopy(event, true);
    // shortcut: no drag-and-drop move inside the text; dropping from outside inserts at the drop point
    const dragStart = (event: DragEvent) => event.preventDefault();
    const beforeInput = (event: InputEvent) => onBeforeInput(event);
    const input = (event: Event) => onInput(event);
    const compositionStart = () => onCompositionStart();
    const compositionEnd = () => onCompositionEnd();
    const paste = (event: ClipboardEvent) => onPaste(event);
    const drop = (event: DragEvent) => onDrop(event);
    const selectionChange = () => onSelectionChange();
    const pointerUp = () => onPointerUp();
    root.addEventListener('beforeinput', beforeInput);
    root.addEventListener('input', input);
    root.addEventListener('compositionstart', compositionStart);
    root.addEventListener('compositionend', compositionEnd);
    root.addEventListener('paste', paste);
    root.addEventListener('copy', copy);
    root.addEventListener('cut', cut);
    root.addEventListener('drop', drop);
    root.addEventListener('dragstart', dragStart);
    document.addEventListener('selectionchange', selectionChange);
    document.addEventListener('pointerup', pointerUp);
    return () => {
      root.removeEventListener('beforeinput', beforeInput);
      root.removeEventListener('input', input);
      root.removeEventListener('compositionstart', compositionStart);
      root.removeEventListener('compositionend', compositionEnd);
      root.removeEventListener('paste', paste);
      root.removeEventListener('copy', copy);
      root.removeEventListener('cut', cut);
      root.removeEventListener('drop', drop);
      root.removeEventListener('dragstart', dragStart);
      document.removeEventListener('selectionchange', selectionChange);
      document.removeEventListener('pointerup', pointerUp);
    };
  }, []);

  const paintEvent = useEffectEvent(() => paint());
  useLayoutEffect(() => paintEvent(), [maxLength]);

  const takeValue = useEffectEvent((next: RichTextValue) => {
    emitted.current = next;
    const doc = normalizeRichText(next);
    if (sameDoc(doc, model.current.doc)) return;
    model.current = { doc, selection: { anchor: clampPoint(doc, model.current.selection.anchor), focus: clampPoint(doc, model.current.selection.focus) } };
    history.current = createRichTextHistory();
    pending.current = null;
    paint();
    sync();
  });
  useLayoutEffect(() => {
    if (value !== undefined && value !== emitted.current) takeValue(value);
  }, [value]);

  // The compact field grows with its text up to six lines, then scrolls; the height animates.
  useEffect(() => {
    const root = editorRef.current;
    if (!root || !compact) return undefined;
    const measure = () => setHeight(Math.min(Math.max(root.scrollHeight, LINE), LINE * COMPACT_LINES));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [compact]);

  /** Floating layers live in a portal, out of every overflow: hidden, so they follow the text by viewport coordinates. */
  const place = useEffectEvent(() => {
    const root = editorRef.current;
    const wrapper = wrapperRef.current;
    if (!root || !wrapper) return;
    const base = wrapper.getBoundingClientRect();
    const menu = menuRef.current;
    const selection = linkEdit?.selection ?? state.selection;
    if (menu) {
      const [start, end] = comparePoints(selection.anchor, selection.focus) <= 0 ? [selection.anchor, selection.focus] : [selection.focus, selection.anchor];
      const from = locate(root, start);
      const to = locate(root, end);
      const range = document.createRange();
      range.setStart(from.node, from.offset);
      range.setEnd(to.node, to.offset);
      const rect = rangeRect(range);
      if (rect) {
        const width = menu.offsetWidth;
        const height = menu.offsetHeight;
        // 8 above the selected line, centred on it, pressed to the field's edge near the sides
        const left = Math.min(Math.max((rect.left + rect.right) / 2 - width / 2, base.left), Math.max(base.left, base.right - width));
        // below it when above there is no room: the screen edge or the field's own toolbar
        const toolbar = wrapper.querySelector('[data-slot=rich-text-editor-toolbar]');
        const ceiling = Math.max(0, toolbar ? toolbar.getBoundingClientRect().bottom : 0);
        menu.style.left = `${left}px`;
        menu.style.top = `${rect.top - 8 - height < ceiling ? rect.bottom + 8 : rect.top - 8 - height}px`;
      }
    }
    const list = listRef.current;
    const panel = list?.firstElementChild;
    if (list && panel instanceof HTMLElement && query) {
      const at = locate(root, query.from);
      const range = document.createRange();
      range.setStart(at.node, at.offset);
      const rect = rangeRect(range);
      if (rect) {
        // under the «@» or «/», 4 below the line; near the bottom of the screen — above it
        const below = rect.bottom + 4;
        const top = below + panel.offsetHeight > window.innerHeight && rect.top - 4 - panel.offsetHeight > 0 ? rect.top - 4 - panel.offsetHeight : below;
        list.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - panel.offsetWidth - 8))}px`;
        list.style.top = `${top}px`;
      }
    }
  });
  useLayoutEffect(() => place());
  const floating = menuOpen || listOpen;
  useEffect(() => {
    if (!floating) return undefined;
    const follow = () => place();
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [floating]);

  /* ----- handlers ----- */

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (listOpen && query) {
      const key = queryKey(query);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive({ key, index: (activeIndex + (event.key === 'ArrowDown' ? 1 : optionCount - 1)) % optionCount });
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const person = mentionMatches[activeIndex];
        const type = blockMatches[activeIndex];
        if (query.kind === 'mention' && person) pickMention(person);
        else if (type) pickBlock(type);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissed.current = key;
        sync();
        return;
      }
    }
    if (!editable) return;
    const mod = event.metaKey || event.ctrlKey;
    if (!mod || event.altKey) return;
    const code = event.code;
    const shortcut = (action: () => void) => {
      event.preventDefault();
      // the text owns these keys: ⌘K is a link here, not the page's command palette
      event.stopPropagation();
      action();
    };
    if (code === 'KeyB' && !event.shiftKey) shortcut(() => toggle('bold'));
    else if (code === 'KeyI' && !event.shiftKey) shortcut(() => toggle('italic'));
    else if (code === 'KeyU' && !event.shiftKey) shortcut(() => toggle('underline'));
    else if (code === 'KeyK' && !event.shiftKey) shortcut(openLink);
    else if (code === 'KeyZ') shortcut(event.shiftKey ? redo : undo);
    else if (code === 'KeyY' && event.ctrlKey && !event.metaKey) shortcut(redo);
    else if (code === 'Digit7' && event.shiftKey) shortcut(() => run((now) => toggleBlockType(now, 'ordered')));
    else if (code === 'Digit8' && event.shiftKey) shortcut(() => run((now) => toggleBlockType(now, 'bullet')));
    else if (event.key === 'Enter' && onSubmit) shortcut(submit);
  };

  const handleFocus = () => {
    if (!focused) setFocused(true);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && [wrapperRef, menuRef, listRef].some((ref) => ref.current?.contains(next))) return;
    setFocused(false);
    pointerDown.current = false;
  };

  /* ----- render ----- */

  const markTool = (mark: RichTextMark, className?: string) => {
    const tool = MARKS[mark];
    const blocked = mark === 'code' ? Boolean(format.href) : inCode;
    return (
      <Tool key={mark} label={tool.label} shortcut={tool.shortcut} pressed={marks.includes(mark)} disabled={!editable || blocked} onRun={() => toggle(mark)} className={cn(mark === 'bold' && '[&_svg]:stroke-[2.25]!', className)}>
        {tool.icon}
      </Tool>
    );
  };
  const blockTool = (type: RichTextBlockType, className?: string) => (
    <Tool key={type} label={BLOCK_LABELS[type]} shortcut={BLOCK_SHORTCUTS[type]} pressed={format.block === type} disabled={!editable} onRun={() => run((now) => toggleBlockType(now, type))} className={className}>
      {BLOCK_ICONS[type]}
    </Tool>
  );
  const linkTool = (className?: string) => (
    <Tool label="Ссылка" shortcut="⌘K" pressed={Boolean(format.href)} disabled={!editable || inCode} onRun={openLink} className={className}>
      <Link aria-hidden />
    </Tool>
  );

  const editorProps = {
    ref: editorRef,
    id: editorId,
    role: 'textbox',
    'aria-multiline': true,
    'aria-label': label ? undefined : ariaLabel,
    'aria-labelledby': label ? labelId : ariaLabelledBy,
    'aria-describedby': cn(ariaDescribedBy, over > 0 && errorId) || undefined,
    'aria-invalid': showInvalid || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-disabled': disabled || undefined,
    'aria-placeholder': placeholder,
    'aria-autocomplete': editable && (people || !compact) ? ('list' as const) : undefined,
    'aria-expanded': editable && (people || !compact) ? listOpen : undefined,
    'aria-controls': listOpen ? listId : undefined,
    'aria-activedescendant': activeId,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    tabIndex: readOnly ? 0 : undefined,
    'data-slot': 'rich-text-editor-content',
    'data-placeholder': placeholder,
    'data-empty': empty ? '' : undefined,
    onKeyDown: handleKeyDown,
    onPointerDown: () => {
      pointerDown.current = true;
    },
  };

  const surface = cn(
    'relative min-w-0 whitespace-pre-wrap break-words text-body-sm text-fg-1 outline-none',
    '[&_h2]:text-heading-sm [&_h2]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through',
    '[&_a]:text-accent-soft-fg [&_a]:underline [&_a]:decoration-1 [&_a]:[text-underline-position:from-font]',
    '[&_code]:rounded-xs [&_code]:bg-fill-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-caption [&_code]:[box-decoration-break:clone]',
    '[&_li]:relative [&_li]:pl-6 [&_li+li]:mt-1 [&_ul>li]:before:absolute [&_ul>li]:before:top-2 [&_ul>li]:before:left-1.5 [&_ul>li]:before:size-1 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-fg-2',
    "[&_ol]:[counter-reset:kv-rt] [&_ol>li]:[counter-increment:kv-rt] [&_ol>li]:before:absolute [&_ol>li]:before:right-[calc(100%-16px)] [&_ol>li]:before:text-fg-2 [&_ol>li]:before:tabular-nums [&_ol>li]:before:content-[counter(kv-rt)_'.']",
    '[&_blockquote]:relative [&_blockquote]:pl-[15px] [&_blockquote]:text-fg-2 [&_blockquote]:before:absolute [&_blockquote]:before:inset-y-0 [&_blockquote]:before:left-0 [&_blockquote]:before:w-[3px] [&_blockquote]:before:rounded-[2px] [&_blockquote]:before:bg-border [&_blockquote>p+p]:mt-2.5',
    '[&_[data-mention-id]]:inline-block [&_[data-mention-id]]:rounded-xs [&_[data-mention-id]]:bg-accent-soft [&_[data-mention-id]]:px-1 [&_[data-mention-id]]:font-medium [&_[data-mention-id]]:text-accent-soft-fg',
    '[&_[data-over]]:text-danger-soft-fg [&_[data-over]]:underline [&_[data-over]]:decoration-1 [&_[data-over]]:[text-underline-position:from-font]',
    'data-empty:before:pointer-events-none data-empty:before:absolute data-empty:before:inset-x-0 data-empty:before:px-[inherit] data-empty:before:text-fg-3 data-empty:before:content-[attr(data-placeholder)]',
    !editable && readOnly && 'cursor-text',
  );

  const frame = cn(
    'relative rounded-xl border transition-[border-color,box-shadow] duration-(--duration-fast) ease-hover',
    disabled ? 'border-input bg-surface-2 opacity-50' : readOnly ? 'border-border bg-surface-2' : showInvalid ? 'border-danger bg-surface-1' : 'border-input bg-surface-1 hover:border-fg-3',
    editable && (showInvalid ? 'focus-within:shadow-[0_0_0_1px_var(--color-danger)]' : 'focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--color-ring)]'),
  );

  const counter =
    maxLength !== undefined ? (
      <>
        <span data-slot="rich-text-editor-counter" data-limit={limit} aria-hidden className="ml-auto shrink-0 text-caption text-fg-3 tabular-nums data-[limit]:font-medium data-[limit=near]:text-warning-soft-fg data-[limit=over]:text-danger-soft-fg">
          {numbers.format(count)} / {numbers.format(maxLength)}
        </span>
        <span aria-live="polite" className="sr-only">
          {limit === 'near' ? `Почти лимит: ${chars(maxLength)}` : limit === 'over' ? `Лимит превышен: больше ${chars(maxLength)}` : ''}
        </span>
      </>
    ) : null;

  const sendButton = onSubmit ? (
    <button
      type="button"
      data-slot="rich-text-editor-submit"
      aria-label={submitLabel ?? 'Отправить'}
      disabled={!canSubmit}
      onMouseDown={(event) => event.preventDefault()}
      onClick={submit}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors duration-(--duration-micro) ease-hover hover:bg-accent-hover disabled:bg-fill-2 disabled:text-fg-4 [&_svg]:size-4 [&_svg]:stroke-2',
        submitLabel ? 'px-3.5 text-label-sm font-medium' : 'w-8',
        focusRing.outside,
      )}
    >
      {submitLabel ?? <ArrowUp aria-hidden />}
    </button>
  ) : null;

  const attachButton = onAttach ? (
    <Tooltip content="Прикрепить файл">
      <button
        type="button"
        aria-label="Прикрепить файл"
        disabled={!editable}
        onClick={onAttach}
        className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full text-fg-3 transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 hover:text-fg-1 disabled:opacity-50 [&_svg]:size-4 [&_svg]:stroke-[1.75]', focusRing.outside)}
      >
        <Paperclip aria-hidden />
      </button>
    </Tooltip>
  ) : null;

  const expanded = compact && (focused || !empty || linkEdit !== null);

  return (
    <div
      ref={wrapperRef}
      data-slot="rich-text-editor"
      data-variant={variant}
      data-invalid={showInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('@container relative flex min-w-0 flex-col gap-1.5', className)}
    >
      {label ? (
        <span id={labelId} data-slot="rich-text-editor-label" onClick={focusEditor} className="text-label-sm font-medium text-fg-2">
          {label}
        </span>
      ) : null}

      {compact ? (
        <div
          data-slot="rich-text-editor-box"
          className={cn(frame, 'grid', expanded ? 'grid-cols-1 gap-2 pt-[11px] pr-1.5 pb-1.5 pl-4' : 'h-control-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-1 pr-1.5 pl-4')}
        >
          <div style={{ height: expanded ? height : LINE }} className={cn('overflow-y-auto transition-[height] duration-(--duration-fast) ease-standard', expanded && 'pr-2.5')}>
            <div {...editorProps} className={cn(surface, '[&>*+*]:mt-1')} />
          </div>
          <div className="flex min-w-0 items-center gap-0.5">
            {expanded ? (
              <>
                {attachButton}
                {markTool('bold', '[&_svg]:size-3.5')}
                {markTool('italic', '[&_svg]:size-3.5')}
                {blockTool('bullet', '[&_svg]:size-3.5')}
                {linkTool('[&_svg]:size-3.5')}
                {people && people.length > 0 ? (
                  <Tool
                    label="Упомянуть"
                    disabled={!editable}
                    className="[&_svg]:size-3.5"
                    onRun={() => {
                      const now = current();
                      model.current = now;
                      focusEditor();
                      const before = textBeforeCaret(deleteSelection(now));
                      typeText(before === '' || /\s$/.test(before) ? '@' : ' @');
                    }}
                  >
                    <AtSign aria-hidden />
                  </Tool>
                ) : null}
                <span className="flex-1" />
                {onSubmit ? <span className="shrink-0 pr-2 text-caption whitespace-nowrap text-fg-4 @max-[400px]:hidden">⌘ Enter</span> : null}
              </>
            ) : (
              attachButton
            )}
            {sendButton}
          </div>
        </div>
      ) : (
        <div data-slot="rich-text-editor-box" className={cn(frame, 'flex flex-col overflow-clip')}>
          {readOnly ? null : (
            <FocusGroup
              role="toolbar"
              aria-label="Форматирование"
              aria-controls={editorId}
              data-slot="rich-text-editor-toolbar"
              className={cn('sticky top-0 z-1 flex h-10 shrink-0 items-center gap-0.5 border-b border-separator bg-inherit px-1.5 @min-[560px]:h-11 @min-[560px]:px-2 [&_svg]:size-4')}
            >
              <Menu>
                <Tooltip content="Тип блока" disabled={!editable}>
                  <MenuTrigger
                    aria-label={`Тип блока: ${BLOCK_LABELS[format.block]}`}
                    disabled={!editable}
                    onMouseDown={(event) => event.preventDefault()}
                    className={cn(
                      'inline-flex h-7 shrink-0 items-center gap-1 rounded-sm pr-1.5 pl-2.5 text-label-sm font-medium text-fg-1 transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 active:bg-fill-3 disabled:opacity-50 data-popup-open:bg-fill-2 [&_svg]:size-3.5! [&_svg]:stroke-2 [&_svg]:text-fg-3',
                      NARROW_HIDDEN,
                      focusRing.outside,
                    )}
                  >
                    {BLOCK_LABELS[format.block]}
                    <ChevronDown aria-hidden />
                  </MenuTrigger>
                </Tooltip>
                <MenuContent finalFocus={editorRef}>
                  <MenuRadioGroup value={format.block} onValueChange={(next) => isBlockType(next) && run((now) => setBlockType(now, next))}>
                    {RICH_TEXT_BLOCKS.map((type) => (
                      <MenuRadioItem key={type} value={type} icon={BLOCK_ICONS[type]} closeOnClick>
                        {BLOCK_LABELS[type]}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuContent>
              </Menu>
              <Divider className={NARROW_HIDDEN} />
              {markTool('bold')}
              {markTool('italic')}
              {markTool('underline', NARROW_HIDDEN)}
              {markTool('strike', NARROW_HIDDEN)}
              <Divider className={NARROW_HIDDEN} />
              {blockTool('heading', NARROW_HIDDEN)}
              {blockTool('bullet')}
              {blockTool('ordered', NARROW_HIDDEN)}
              {blockTool('quote', NARROW_HIDDEN)}
              <Divider className={NARROW_HIDDEN} />
              {linkTool()}
              {markTool('code', NARROW_HIDDEN)}
              <Menu>
                <Tooltip content="Ещё" disabled={!editable}>
                  <MenuTrigger aria-label="Ещё форматирование" disabled={!editable} onMouseDown={(event) => event.preventDefault()} className={cn(toolLook, 'data-popup-open:bg-fill-2 @min-[560px]:hidden')}>
                    <Ellipsis aria-hidden className="stroke-[2.5]!" />
                  </MenuTrigger>
                </Tooltip>
                <MenuContent finalFocus={editorRef}>
                  {(['underline', 'strike'] as const).map((mark) => (
                    <MenuCheckboxItem key={mark} closeOnClick checked={marks.includes(mark)} disabled={inCode} icon={MARKS[mark].icon} onCheckedChange={() => toggle(mark)}>
                      {MARKS[mark].label}
                    </MenuCheckboxItem>
                  ))}
                  {(['heading', 'ordered', 'quote'] as const).map((type) => (
                    <MenuCheckboxItem key={type} closeOnClick checked={format.block === type} icon={BLOCK_ICONS[type]} onCheckedChange={() => run((now) => toggleBlockType(now, type))}>
                      {BLOCK_LABELS[type]}
                    </MenuCheckboxItem>
                  ))}
                  <MenuCheckboxItem closeOnClick checked={marks.includes('code')} disabled={Boolean(format.href)} icon={MARKS.code.icon} onCheckedChange={() => toggle('code')}>
                    {MARKS.code.label}
                  </MenuCheckboxItem>
                </MenuContent>
              </Menu>
              <span className={cn('flex-1', NARROW_HIDDEN)} />
              <Tool label="Отменить" shortcut="⌘Z" disabled={!editable || !canUndo} onRun={undo} className={NARROW_HIDDEN}>
                <Undo2 aria-hidden />
              </Tool>
              <Tool label="Повторить" shortcut="⇧⌘Z" disabled={!editable || !canRedo} onRun={redo} className={NARROW_HIDDEN}>
                <Redo2 aria-hidden />
              </Tool>
            </FocusGroup>
          )}
          <div
            {...editorProps}
            style={{ minHeight: `calc(${minRows} * var(--leading-body-sm) + 24px)` }}
            className={cn(surface, 'px-4 py-3 @min-[560px]:px-5 @min-[560px]:pt-4 @min-[560px]:pb-2 [&>*+*]:mt-2.5')}
          />
          {status || counter ? (
            <div
              data-slot="rich-text-editor-footer"
              className={cn('flex shrink-0 items-center gap-3 px-4 @min-[560px]:px-5', readOnly ? 'h-9 border-t border-separator' : 'h-8 @min-[560px]:h-9')}
            >
              {status}
              {counter}
            </div>
          ) : null}
        </div>
      )}

      {over > 0 ? (
        <p id={errorId} data-slot="rich-text-editor-error" className="flex items-center gap-1.5 text-caption text-danger-soft-fg [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]">
          <CircleX aria-hidden />
          Сократите текст на {chars(over)}
        </p>
      ) : null}

      {menuOpen ? (
        <Portal layer="dropdown">
          <div
            ref={menuRef}
            role="toolbar"
            aria-label={linkEdit ? 'Ссылка' : 'Формат выделения'}
            data-slot="rich-text-editor-selection-menu"
            className="fixed top-0 left-0 flex items-center gap-0.5 rounded-md bg-overlay p-1 shadow-overlay transition-[opacity,translate] duration-(--duration-quick) ease-out starting:translate-y-(--shift-sm) starting:opacity-0 [&_svg]:size-4"
          >
            {linkEdit ? (
              <form
                data-slot="rich-text-editor-link-field"
                className="flex w-90 max-w-[calc(100vw-32px)] items-center gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyLink(linkEdit);
                }}
              >
                <span className="flex h-7 min-w-0 flex-1 items-center gap-2 px-2">
                  <Link aria-hidden className="size-3.5! shrink-0 text-fg-3" />
                  <input
                    // the field replaces the menu, so it takes focus at once
                    autoFocus
                    aria-label="Адрес ссылки"
                    aria-invalid={linkEdit.invalid || undefined}
                    placeholder="Ссылка, почта или телефон"
                    value={linkEdit.value}
                    onChange={(event) => setLinkEdit({ ...linkEdit, value: event.target.value, invalid: false })}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        closeLink();
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-label-sm text-fg-1 outline-none placeholder:text-fg-3 aria-invalid:text-danger-soft-fg"
                  />
                </span>
                {linkEdit.existing ? (
                  <Tooltip content="Убрать ссылку">
                    <button type="button" aria-label="Убрать ссылку" onClick={() => applyLink(linkEdit, true)} className={cn(toolLook, 'text-fg-3')}>
                      <Trash aria-hidden />
                    </button>
                  </Tooltip>
                ) : null}
                <button type="submit" className={cn('inline-flex h-7 shrink-0 items-center rounded-full bg-accent px-3 text-label-sm font-medium text-accent-fg transition-colors duration-(--duration-micro) ease-hover hover:bg-accent-hover', focusRing.outside)}>
                  Готово
                </button>
              </form>
            ) : (
              <>
                {markTool('bold')}
                {markTool('italic')}
                {markTool('strike')}
                <Divider className="mx-1" />
                {linkTool()}
                {markTool('code')}
                {selectionActions ? (
                  <>
                    <Divider className="mx-1" />
                    <SelectionActions render={selectionActions} text={selectionText(state.doc, state.selection)} onReplace={replaceSelection} />
                  </>
                ) : null}
              </>
            )}
          </div>
        </Portal>
      ) : null}

      {listOpen && query ? (
        <Portal layer="dropdown">
          <div ref={listRef} className="fixed top-0 left-0">
            {query.kind === 'mention' ? (
                <MentionSuggestions
                  id={listId}
                  matches={mentionMatches}
                  query={query.text}
                  active={activeIndex}
                  onActiveChange={(index) => setActive({ key: queryKey(query), index })}
                  onPick={pickMention}
                  style={{ left: 0, top: 0 }}
                />
            ) : (
                <div id={listId} role="listbox" aria-label="Блоки" data-slot="rich-text-editor-blocks" className="absolute top-0 left-0 flex w-60 flex-col rounded-lg bg-overlay p-1.5 shadow-overlay">
                  <p aria-hidden className="px-2 pt-1 pb-1.5 text-caption font-medium text-fg-3">
                    Блоки
                  </p>
                  {blockMatches.map((type, index) => (
                    <div
                      key={type}
                      id={`${listId}-${type}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        pickBlock(type);
                      }}
                      onMouseEnter={() => setActive({ key: queryKey(query), index })}
                      className="flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-body-sm text-fg-1 aria-selected:bg-fill-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&_svg]:text-fg-2"
                    >
                      {BLOCK_ICONS[type]}
                      {BLOCK_LABELS[type]}
                    </div>
                  ))}
                </div>
            )}
          </div>
        </Portal>
      ) : null}
    </div>
  );
}
