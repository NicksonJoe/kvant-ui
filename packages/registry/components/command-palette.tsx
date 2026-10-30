import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { Search } from 'lucide-react';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { Kbd } from './badge';
import { HighlightMatch } from './combobox';

export interface CommandItem {
  id: string;
  label: string;
  /** Muted context after the label: «Клиент · 4 сделки». */
  hint?: string;
  /** 18px icon or a 24px avatar. */
  icon?: ReactNode;
  shortcut?: string;
  /** Extra words that should find this item. */
  keywords?: readonly string[];
  onSelect: () => void;
}

export interface CommandGroup {
  label: string;
  items: readonly CommandItem[];
}

// type alias (not interface) so it satisfies Base UI's indexable Group<T>
type ListGroup = {
  value: string;
  items: CommandItem[];
};

export interface CommandPaletteProps {
  groups: readonly CommandGroup[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** ⌘K / Ctrl+K toggles the palette (layout-independent: works on a Russian layout too). */
  hotkey?: boolean;
}

const plural = new Intl.PluralRules('ru');
const resultWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'результат', few: 'результата', many: 'результатов' };

export function formatResultCount(count: number): string {
  return `${count}\u00a0${resultWords[plural.select(count)] ?? 'результата'}`;
}

/** 0 — the label starts with the query, 1 — contains it, 2 — only a hint or keyword does, -1 — no match. */
function rank(item: CommandItem, needle: string): number {
  const label = item.label.toLocaleLowerCase('ru');
  if (label.startsWith(needle)) return 0;
  if (label.includes(needle)) return 1;
  return [item.hint ?? '', ...(item.keywords ?? [])].some((text) => text.toLocaleLowerCase('ru').includes(needle)) ? 2 : -1;
}

/**
 * ⌘K palette: glass panel 640 wide, opens instantly (no animation), arrows move the highlight,
 * Enter runs the item, Esc closes. Empty query shows everything.
 */
export function CommandPalette({ groups, open: openProp, onOpenChange, placeholder = 'Поиск и команды', hotkey = true }: CommandPaletteProps) {
  const [ownOpen, setOwnOpen] = useState(false);
  const [query, setQuery] = useState('');
  const open = openProp ?? ownOpen;

  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    if (next) setQuery('');
    onOpenChange?.(next);
  };

  const toggle = useEffectEvent(() => setOpen(!open));
  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkey]);

  const needle = query.trim().toLocaleLowerCase('ru');
  // best matches first, groups ordered by their best item; an empty query keeps the given order (the sort is stable)
  const filtered: ListGroup[] = groups
    .map((group) => {
      const ranked = group.items
        .map((item) => ({ item, rank: rank(item, needle) }))
        .filter((entry) => entry.rank >= 0)
        .sort((a, b) => a.rank - b.rank);
      return { value: group.label, items: ranked.map((entry) => entry.item), best: ranked[0]?.rank ?? -1 };
    })
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.best - b.best);
  const count = filtered.reduce((sum, group) => sum + group.items.length, 0);

  const run = (item: CommandItem) => {
    setOpen(false);
    item.onSelect();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-scrim" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[min(112px,12vh)]">
          <Dialog.Popup
            data-slot="command-palette"
            aria-label="Командная палитра"
            className="flex max-h-[min(560px,calc(100dvh-140px))] w-[640px] max-w-full flex-col overflow-hidden rounded-2xl bg-glass-strong text-fg-1 shadow-modal outline-none backdrop-blur-[20px] backdrop-saturate-[1.8]"
          >
            <Autocomplete.Root
              open
              inline
              items={filtered}
              filteredItems={filtered}
              value={query}
              onValueChange={setQuery}
              autoHighlight="always"
              keepHighlight
              itemToStringValue={(item: CommandItem) => item.label}
            >
              <div className="flex h-14 shrink-0 items-center gap-3 px-4">
                <Search aria-hidden className="size-5 shrink-0 stroke-[1.5] text-fg-3" />
                <Autocomplete.Input
                  aria-label="Поиск по командам"
                  placeholder={placeholder}
                  className="h-full min-w-0 flex-1 bg-transparent text-body-md text-fg-1 outline-none placeholder:text-fg-3"
                />
                {needle ? <span className="shrink-0 text-caption text-fg-3 tabular-nums">{formatResultCount(count)}</span> : null}
                <Kbd aria-hidden>Esc</Kbd>
                <Dialog.Close className="sr-only">Закрыть</Dialog.Close>
              </div>
              <div className="h-px shrink-0 bg-separator" />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 [scroll-padding-block:6px]">
                <Autocomplete.Empty className="flex min-h-24 flex-col items-center justify-center gap-1 text-center empty:hidden">
                  <span className="text-label-md font-medium text-fg-1">Ничего не найдено</span>
                  <span className="text-body-xs text-fg-3">Попробуйте другое слово</span>
                </Autocomplete.Empty>
                <Autocomplete.List className="flex flex-col gap-1 empty:hidden">
                  {(group: ListGroup) => (
                    <Autocomplete.Group key={group.value} items={group.items} className="flex flex-col">
                      <Autocomplete.GroupLabel className="px-2.5 pt-1.5 pb-1 text-caption font-medium text-fg-3">
                        {group.value}
                      </Autocomplete.GroupLabel>
                      <Autocomplete.Collection>
                        {(item: CommandItem) => (
                          <Autocomplete.Item
                            key={item.id}
                            value={item}
                            onClick={() => run(item)}
                            className="flex h-10 cursor-default select-none items-center gap-3 rounded-md px-2.5 text-body-sm outline-none [scroll-margin-block:6px] data-highlighted:bg-fill-2"
                          >
                            <span
                              aria-hidden
                              className="grid size-6 shrink-0 place-items-center text-fg-2 [&_svg]:size-[18px] [&_svg]:stroke-[1.75]"
                            >
                              {item.icon}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              <span className="text-fg-1">
                                <HighlightMatch text={item.label} query={query.trim()} />
                              </span>
                              {item.hint ? <span className="ml-2 text-fg-3">{item.hint}</span> : null}
                            </span>
                            {item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.Collection>
                    </Autocomplete.Group>
                  )}
                </Autocomplete.List>
              </div>
              <div
                aria-hidden
                className="flex h-11 shrink-0 items-center gap-4 border-t border-separator px-4 text-caption text-fg-3"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  выбрать
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>↵</Kbd>
                  открыть
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5">
                  <Kbd>Esc</Kbd>
                  закрыть
                </span>
              </div>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
