import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonClasses } from '@/kvant';
import { getComponent } from '@/kvant/meta';
import { StatusBadge } from '../components/StatusBadge';

interface Block {
  id: string;
  title: string;
  description: string;
  uses: readonly string[];
  sketch: ReactNode;
}

const bar = 'rounded-full bg-fill-2';

const BLOCKS: readonly Block[] = [
  {
    id: 'landing',
    title: 'Лендинг Норды',
    description: 'Финальный лендинг norda.cloud: первый экран, возможности, тарифы, отзывы и подвал. Десктоп 1440 и мобильный 402.',
    uses: ['button', 'card', 'badge', 'tabs'],
    sketch: (
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-fg-1" />
          <span className={`${bar} h-2 w-16`} />
          <span className="flex-1" />
          <span className="h-4 w-12 rounded-full bg-accent" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className={`${bar} h-3 w-2/3 bg-fg-1/80`} />
          <span className={`${bar} h-2 w-1/2`} />
          <span className="mt-1 h-4 w-16 rounded-full bg-accent" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <span key={index} className="h-10 rounded-md bg-surface-1 shadow-raised" />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'admin-shell',
    title: 'Оболочка админки',
    description: 'Боковая панель, верхняя панель, ⌘K и таблица сделок — каркас любого раздела рабочего кабинета.',
    uses: ['sidebar', 'topbar', 'command-palette', 'table'],
    sketch: (
      <div className="flex h-full">
        <div className="flex w-1/4 flex-col gap-2 border-r border-separator p-3">
          <span className={`${bar} h-2 w-3/4`} />
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={index === 1 ? 'h-3 rounded-full bg-surface-1 shadow-raised' : `${bar} h-2 w-2/3`} />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <span className={`${bar} h-2 w-16`} />
            <span className="flex-1" />
            <span className="h-3 w-20 rounded-full shadow-[inset_0_0_0_1px_var(--color-input)]" />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden rounded-md bg-surface-1 shadow-raised">
            <span className="h-3 bg-surface-2" />
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="flex h-4 items-center gap-2 border-t border-separator px-2">
                <span className={`${bar} h-1.5 w-1/3`} />
                <span className="flex-1" />
                <span className={`${bar} h-1.5 w-8`} />
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ios-screens',
    title: 'Экраны iOS',
    description: 'Двенадцать экранов в порядке пути пользователя: вход, сделки, карточка клиента, задачи и профиль.',
    uses: ['tab-bar', 'list', 'sheet', 'button'],
    sketch: (
      <div className="flex h-full items-center justify-center gap-3 p-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="relative flex h-full w-1/4 flex-col gap-1.5 rounded-xl bg-surface-1 p-2 shadow-raised">
            <span className={`${bar} h-2 w-2/3 bg-fg-1/70`} />
            {[0, 1, 2].map((row) => (
              <span key={row} className={`${bar} h-1.5`} />
            ))}
            <span className="absolute inset-x-2 bottom-2 h-3 rounded-full bg-glass shadow-glass" />
          </div>
        ))}
      </div>
    ),
  },
];

export function BlocksPage() {
  return (
    <main id="content" className="flex flex-col gap-10 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-display-sm font-semibold text-fg-1">Блоки</h1>
        <p className="max-w-[72ch] text-body-lg text-fg-2">
          Готовые решения из компонентов Kvant: экраны и разделы целиком. Они уже собраны в Paper и переезжают в код следом за компонентами,
          из которых состоят.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {BLOCKS.map((block) => (
          <article key={block.id} className="flex flex-col overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
            <div aria-hidden className="docs-stage h-52 border-b border-separator">
              {block.sketch}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-heading-xs font-semibold text-fg-1">{block.title}</h2>
                <StatusBadge status="planned" />
              </div>
              <p className="text-body-sm text-fg-2">{block.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-caption text-fg-3">
                Из компонентов:
                {block.uses.map((id) => (
                  <Link key={id} to={`/components/${id}`} className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                    {getComponent(id)?.title ?? id}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
