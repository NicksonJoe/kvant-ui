import { ChevronDown, CircleCheck, Copy, Folder, Pencil, Search, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, Button, Input, Kbd, cn } from '@/kvant';
import { listItem, listItemTone, listSeparator, popupSurface } from '@/kvant/lib/recipes';

/** Static pictures of overlays for catalogue cards: the real ones live in portals and need a click. */
const menuRows = (
  <>
    <div className={cn(listItem, listItemTone, 'bg-fill-2')}>
      <Pencil />
      <span className="flex-1">Изменить</span>
      <span className="font-mono text-caption text-fg-3">⌘E</span>
    </div>
    <div className={cn(listItem, listItemTone)}>
      <Copy />
      <span className="flex-1">Дублировать</span>
      <span className="font-mono text-caption text-fg-3">⌘D</span>
    </div>
    <div className={cn(listItem, listItemTone)}>
      <Folder />
      <span className="flex-1">Переместить</span>
    </div>
    <div className={listSeparator} />
    <div className={cn(listItem, 'text-danger-soft-fg [&>svg]:text-danger-soft-fg')}>
      <Trash2 />
      <span className="flex-1">Удалить</span>
    </div>
  </>
);

export const THUMBNAILS: Record<string, ReactNode> = {
  dialog: (
    <div className="flex w-[380px] flex-col gap-4 rounded-3xl bg-overlay p-6 shadow-modal">
      <span className="text-heading-md font-semibold">Новая задача</span>
      <span className="text-body-sm text-fg-2">Задача появится в карточке сделки.</span>
      <Input aria-label="Задача" placeholder="Позвонить Ольге Мироновой" />
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Отмена</Button>
        <Button>Создать</Button>
      </div>
    </div>
  ),
  'alert-dialog': (
    <div className="flex w-[360px] flex-col gap-4 rounded-3xl bg-overlay p-6 shadow-modal">
      <span className="grid size-10 place-items-center rounded-full bg-danger-soft text-danger-soft-fg">
        <Trash2 className="size-5 stroke-[1.5]" />
      </span>
      <span className="text-heading-md font-semibold">Удалить сделку?</span>
      <span className="text-body-sm text-fg-2">Это нельзя отменить.</span>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Отмена</Button>
        <Button variant="danger">Удалить</Button>
      </div>
    </div>
  ),
  sheet: (
    <div className="relative h-[280px] w-[460px] overflow-hidden rounded-2xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <div className="absolute inset-0 bg-scrim" />
      <div className="absolute inset-y-2 right-2 flex w-[230px] flex-col gap-3 rounded-3xl bg-overlay p-5 shadow-modal">
        <span className="text-heading-xs font-semibold">Ольга Миронова</span>
        <span className="text-caption text-fg-3">Пекарня «Хлебница»</span>
        <Input size="sm" aria-label="Телефон" defaultValue="+7 921 555-01-14" />
        <Input size="sm" aria-label="Почта" defaultValue="olga@hlebnitsa.ru" />
        <Button size="sm" className="mt-auto self-end">
          Сохранить
        </Button>
      </div>
    </div>
  ),
  popover: (
    <div className="flex flex-col items-center gap-2">
      <Button variant="secondary">Напомнить</Button>
      <div className="flex w-72 flex-col gap-2 rounded-xl bg-overlay p-4 shadow-overlay">
        <span className="text-heading-xs font-semibold">Напоминание о сделке</span>
        <span className="text-body-sm text-fg-2">Созвон по смете в пятницу, 30 октября, в 11:00.</span>
      </div>
    </div>
  ),
  tooltip: (
    <div className="flex flex-col items-center gap-1">
      <span className="flex items-center gap-2 rounded-full bg-fg-1 px-2.5 py-1.5 text-caption font-medium text-surface-1 shadow-tooltip">
        Скопировать ссылку
        <span className="font-mono text-[11px] opacity-70">⇧⌘C</span>
      </span>
      <Button variant="secondary" leadingIcon={<Copy />}>
        Ссылка
      </Button>
    </div>
  ),
  menu: (
    <div className="flex flex-col items-start gap-1">
      <Button variant="secondary" trailingIcon={<ChevronDown />} aria-expanded>
        Действия
      </Button>
      <div className={cn(popupSurface, 'w-56')}>{menuRows}</div>
    </div>
  ),
  toast: (
    <div className="flex w-[340px] items-start gap-3 rounded-xl bg-glass-strong px-4 py-3 shadow-overlay backdrop-blur-[20px]">
      <CircleCheck className="size-5 shrink-0 stroke-[1.5] text-success" />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-label-md font-medium">Сделка в архиве</span>
        <span className="text-body-xs text-fg-2">Айдентика для пекарни</span>
      </div>
      <span className="text-label-md font-medium text-accent-soft-fg">Отменить</span>
    </div>
  ),
  'command-palette': (
    <div className="flex w-[440px] flex-col overflow-hidden rounded-2xl bg-glass-strong shadow-modal">
      <div className="flex h-12 items-center gap-3 px-4">
        <Search className="size-5 stroke-[1.5] text-fg-3" />
        <span className="flex-1 text-body-md text-fg-1">Сд</span>
        <Kbd>Esc</Kbd>
      </div>
      <div className="h-px bg-separator" />
      <div className="flex flex-col p-1.5">
        <span className="px-2.5 pt-1.5 pb-1 text-caption font-medium text-fg-3">Разделы</span>
        <span className="flex h-10 items-center gap-3 rounded-md bg-fill-2 px-2.5 text-body-sm">
          <span className="font-semibold">Сд</span>елки
        </span>
        <span className="flex h-10 items-center gap-3 rounded-md px-2.5 text-body-sm">
          <Avatar name="Ольга Миронова" size={24} />
          Ольга Миронова <span className="text-fg-3">· 2 сделки</span>
        </span>
      </div>
    </div>
  ),
};
