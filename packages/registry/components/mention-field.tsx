import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Avatar } from './card';

export interface MentionPerson {
  id: string;
  name: string;
  /** Line under the name: role, «в отпуске до 10 ноября». */
  role?: string;
  avatarSrc?: string;
}

/** Plain text with mentions as «@Имя», and the ids of the people mentioned in order. */
export interface MentionValue {
  text: string;
  mentions: readonly string[];
}

export interface MentionFieldProps {
  'aria-label': string;
  people: readonly MentionPerson[];
  placeholder?: string;
  onValueChange?: (value: MentionValue) => void;
  /** Rows of text before it scrolls. */
  minRows?: number;
  className?: string;
}

const LIMIT = 6;

function serialize(root: HTMLElement): MentionValue {
  let text = '';
  const mentions: string[] = [];
  // browsers wrap every new line in a div (or p), so walk the whole tree, not just the top level
  const walk = (parent: Node) => {
    parent.childNodes.forEach((node) => {
      if (node instanceof HTMLElement && node.dataset.mentionId) {
        mentions.push(node.dataset.mentionId);
        text += node.textContent ?? '';
      } else if (node instanceof HTMLBRElement) {
        text += '\n';
      } else if (node instanceof HTMLElement) {
        if (/^(DIV|P)$/.test(node.tagName) && text !== '' && !text.endsWith('\n')) text += '\n';
        walk(node);
      } else {
        text += node.textContent ?? '';
      }
    });
  };
  walk(root);
  return { text, mentions };
}

/** The query of a «@мар» that ends the text before the caret, or null. */
export function mentionQuery(textBeforeCaret: string): string | null {
  return /(?:^|\s)@([\p{L}\p{N}-]*)$/u.exec(textBeforeCaret)?.[1] ?? null;
}

/** «@мар» right before the caret, or null when the caret is not in a mention query. */
function readQuery(): { node: Text; start: number; end: number; query: string } | null {
  const selection = document.getSelection();
  const node = selection?.focusNode;
  if (!selection?.isCollapsed || !(node instanceof Text)) return null;
  const query = mentionQuery(node.data.slice(0, selection.focusOffset));
  if (query === null) return null;
  return { node, start: selection.focusOffset - query.length - 1, end: selection.focusOffset, query };
}

/** People whose first or last name starts with the query, at most six. */
export function matchMentionPeople(people: readonly MentionPerson[], query: string): MentionPerson[] {
  const needle = query.toLocaleLowerCase('ru');
  return people.filter((person) => person.name.toLocaleLowerCase('ru').split(/\s+/).some((word) => word.startsWith(needle))).slice(0, LIMIT);
}

function highlight(name: string, query: string): ReactNode {
  if (!query) return name;
  const needle = query.toLocaleLowerCase('ru');
  // bold the start of the word that matched: «Мария Ким» for «мар», «Илья Громов» for «гр»
  const index = [...name.toLocaleLowerCase('ru').matchAll(/\S+/g)].find((word) => word[0].startsWith(needle))?.index ?? -1;
  if (index < 0) return name;
  return (
    <>
      {name.slice(0, index)}
      <b className="font-semibold">{name.slice(index, index + query.length)}</b>
      {name.slice(index + query.length)}
    </>
  );
}

/**
 * Comment field where «@» opens people right under the caret. The list filters as you type, the first row is active,
 * Enter or Tab inserts it as a whole chip that one Backspace removes.
 */
export function MentionField({ people, placeholder, onValueChange, minRows = 3, className, 'aria-label': label }: MentionFieldProps) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });
  const matches = query === null ? [] : matchMentionPeople(people, query);
  const open = matches.length > 0;

  const update = () => {
    const found = readQuery();
    setQuery(found?.query ?? null);
    setActive(0);
    if (found && wrapper.current) {
      const range = document.createRange();
      range.setStart(found.node, found.start);
      const rect = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
      const base = wrapper.current.getBoundingClientRect();
      if (rect) setAnchor({ left: rect.left - base.left, top: rect.bottom - base.top + 4 });
    }
    if (box.current) onValueChange?.(serialize(box.current));
  };

  const insert = (person: MentionPerson) => {
    const found = readQuery();
    const root = box.current;
    if (!found || !root) return;
    const range = document.createRange();
    range.setStart(found.node, found.start);
    range.setEnd(found.node, found.end);
    range.deleteContents();
    const chip = document.createElement('span');
    chip.contentEditable = 'false';
    chip.dataset.mentionId = person.id;
    chip.className = 'rounded-xs bg-accent-soft px-1 font-medium text-accent-soft-fg';
    chip.textContent = `@${person.name}`;
    // a no-break space keeps the caret outside the chip
    const space = document.createTextNode(' ');
    range.insertNode(space);
    range.insertNode(chip);
    const selection = document.getSelection();
    selection?.collapse(space, 1);
    setQuery(null);
    onValueChange?.(serialize(root));
  };

  return (
    <div ref={wrapper} data-slot="mention-field" className={cn('relative', className)}>
      <div
        ref={box}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${matches[active]?.id ?? ''}` : undefined}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={update}
        onKeyUp={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) update();
        }}
        onBlur={() => setQuery(null)}
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length);
          } else if (event.key === 'Enter' || event.key === 'Tab') {
            const person = matches[active];
            if (!person) return;
            event.preventDefault();
            insert(person);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setQuery(null);
          }
        }}
        style={{ minHeight: `calc(${minRows} * var(--leading-body-sm) + 24px)` }}
        className="w-full overflow-y-auto rounded-xl bg-field px-3.5 py-3 text-body-sm text-fg-1 shadow-[inset_0_0_0_1px_var(--color-input)] outline-none empty:before:text-fg-3 empty:before:content-[attr(data-placeholder)] focus:shadow-[inset_0_0_0_1px_var(--color-ring),0_0_0_1px_var(--color-ring)]"
      />
      {open ? (
        <MentionSuggestions
          id={listId}
          matches={matches}
          query={query ?? ''}
          active={active}
          onActiveChange={setActive}
          onPick={insert}
          style={{ left: Math.max(0, anchor.left), top: anchor.top }}
        />
      ) : null}
    </div>
  );
}

export interface MentionSuggestionsProps {
  /** Id of the listbox; options get `${id}-${person.id}` for aria-activedescendant. */
  id: string;
  matches: readonly MentionPerson[];
  query: string;
  active: number;
  onActiveChange: (index: number) => void;
  onPick: (person: MentionPerson) => void;
  /** Absolute place under the caret, relative to the positioned parent. */
  style?: CSSProperties;
}

/** The people list under the caret, shared by MentionField and RichTextEditor; focus stays in the field. */
export function MentionSuggestions({ id, matches, query, active, onActiveChange, onPick, style }: MentionSuggestionsProps) {
  return (
    <div id={id} role="listbox" aria-label="Люди" data-slot="mention-suggestions" className="absolute z-50 flex w-72 flex-col rounded-lg bg-overlay p-1.5 shadow-overlay" style={style}>
      <p aria-hidden className="px-2 pt-1 pb-1.5 text-caption font-medium text-fg-3">
        Люди
      </p>
      {matches.map((person, index) => (
        <div
          key={person.id}
          id={`${id}-${person.id}`}
          role="option"
          aria-selected={index === active}
          onMouseDown={(event) => {
            // keep the caret in the field
            event.preventDefault();
            onPick(person);
          }}
          onMouseEnter={() => onActiveChange(index)}
          className={cn('flex cursor-default items-center gap-3 rounded-md px-2 py-1.5', index === active && 'bg-fill-2')}
        >
          <Avatar name={person.name} src={person.avatarSrc} size={32} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm text-fg-1">{highlight(person.name, query)}</span>
            {person.role ? <span className="truncate text-caption text-fg-3">{person.role}</span> : null}
          </span>
        </div>
      ))}
      <p aria-hidden className="flex gap-3 border-t border-separator px-2 pt-1.5 pb-0.5 text-caption text-fg-3">
        <span>↑↓ выбрать</span>
        <span>↵ вставить</span>
        <span>Esc — закрыть</span>
      </p>
    </div>
  );
}
