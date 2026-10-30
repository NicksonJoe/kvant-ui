import { Bookmark, Plus, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Button, Kbd, Tour } from '@/kvant';

export default function TourDeals() {
  const [open, setOpen] = useState(false);
  // Targets are found by selector inside this frame, so two copies on a page never mix up.
  const scope = useId();
  const target = (name: string) => `[data-tour-scope="${scope}"] [data-tour="${name}"]`;

  return (
    <div className="flex w-full max-w-160 flex-col gap-4">
      <div data-tour-scope={scope} className="flex flex-col gap-3 rounded-2xl bg-background p-4 shadow-raised">
        <div className="flex items-center gap-2">
          <span className="mr-auto text-heading-xs font-semibold">Сделки</span>
          <span
            data-tour="search"
            className="inline-flex h-8 items-center gap-2 rounded-full bg-surface-1 pr-1.5 pl-3 text-body-sm text-fg-3 shadow-control"
          >
            <Search aria-hidden className="size-4" />
            Поиск
            <Kbd>⌘K</Kbd>
          </span>
          <Button data-tour="new-deal" size="sm" leadingIcon={<Plus />}>
            Новая сделка
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline">
            Ответственный: все
          </Button>
          <Button size="sm" variant="outline">
            Этап: все
          </Button>
          <Button data-tour="saved-filters" size="sm" variant="secondary" leadingIcon={<Bookmark />}>
            Сохранённые фильтры
          </Button>
        </div>
      </div>
      <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
        Показать тур
      </Button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          {
            target: target('new-deal'),
            title: 'Новая сделка',
            description: 'Начните с клиента и суммы — остальное можно заполнить позже.',
          },
          {
            target: target('saved-filters'),
            title: 'Сохранённые фильтры',
            description: 'Соберите фильтр по ответственному и этапу один раз — и переключайтесь между воронками в один клик.',
          },
          {
            target: target('search'),
            title: 'Поиск по всей базе',
            description: 'Нажмите ⌘K, чтобы найти сделку, контакт или файл из любого раздела.',
          },
        ]}
      />
    </div>
  );
}
