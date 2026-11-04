import { useState } from 'react';
import { CanvasGraphSearch, type CanvasSearchResult } from '@/kvant';

const GRAPH: readonly CanvasSearchResult[] = [
  { id: 'notify', kind: 'step', title: 'Уведомить менеджера', detail: 'Шаг · Действия' },
  { id: 'deal', kind: 'setting', title: 'Создать сделку', detail: 'Настройка «Ответственный»: менеджер по очереди' },
  { id: 'agent', kind: 'setting', title: 'Разобрать заявку', detail: 'Инструкция: передай менеджеру, если бюджета нет' },
  { id: 'reply', kind: 'step', title: 'Ответить шаблоном', detail: 'Шаг · Действия' },
  { id: 'note', kind: 'note', title: 'Порог бюджета согласовать…', detail: 'Стикер · Анна' },
];

const search = (query: string) => {
  const needle = query.trim().toLocaleLowerCase('ru');
  if (!needle) return [];
  return GRAPH.filter((item) => `${item.title} ${item.detail ?? ''}`.toLocaleLowerCase('ru').includes(needle));
};

export default function CanvasGraphSearchExample() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('менеджер');
  const [focused, setFocused] = useState('');
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center gap-4 rounded-xl bg-surface-2 p-8">
      {open ? (
        <CanvasGraphSearch
          query={query}
          onQueryChange={setQuery}
          results={search(query)}
          onNavigate={(result) => setFocused(result.title)}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button type="button" className="text-body-sm text-accent-soft-fg underline" onClick={() => setOpen(true)}>
          Открыть поиск (⌘F)
        </button>
      )}
      <p className="text-body-sm text-fg-2" aria-live="polite">
        {focused ? `Камера на «${focused}»` : 'Находок нет'}
      </p>
    </div>
  );
}
