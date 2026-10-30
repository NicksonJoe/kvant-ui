import { useState } from 'react';
import { Link } from 'react-router';
import { SegmentedControl } from '@/kvant';
import { categories, components, isReady, type ComponentMeta, type ReadyComponentMeta } from '@/kvant/meta';
import { ComponentPreview } from '../components/ComponentPreview';
import { StatusBadge } from '../components/StatusBadge';
import { PageShell } from '../layouts/SidebarLayout';
import { navComponents } from '../lib/registry';

type Filter = 'all' | 'ready' | 'planned';

const readyCount = components.filter(isReady).length;

function ReadyCard({ meta }: { meta: ReadyComponentMeta }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised transition-shadow duration-(--duration-quick) ease-hover hover:shadow-overlay has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <ComponentPreview meta={meta} className="h-40" />
      <div className="flex flex-1 flex-col gap-1 border-t border-separator px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/components/${meta.id}`}
            className="text-label-md font-medium text-fg-1 outline-none after:absolute after:inset-0 after:content-['']"
          >
            {meta.title}
          </Link>
          {meta.status === 'beta' ? <StatusBadge status="beta" /> : null}
        </div>
        <p className="line-clamp-2 text-body-xs text-fg-3">{meta.description}</p>
      </div>
    </div>
  );
}

function PlannedCard({ meta }: { meta: ComponentMeta }) {
  return (
    <div className="relative flex flex-col gap-1.5 rounded-xl px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-hairline)] transition-colors duration-(--duration-micro) hover:bg-fill-1 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/components/${meta.id}`} className="text-label-md font-medium text-fg-2 outline-none after:absolute after:inset-0 after:content-['']">
          {meta.title}
        </Link>
        <StatusBadge status="planned" />
      </div>
      <p className="line-clamp-2 text-body-xs text-fg-3">{meta.description}</p>
    </div>
  );
}

export function ComponentsIndex() {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = (meta: ComponentMeta) => filter === 'all' || (filter === 'ready') === isReady(meta);
  const groups = categories
    .map((category) => ({ category, items: navComponents(category).filter(visible) }))
    .filter((group) => group.items.length > 0);

  return (
    <PageShell toc={groups.map(({ category }) => ({ id: `category-${category.id}`, title: category.title }))}>
      <header className="flex flex-col gap-4">
        <h1 className="text-display-sm font-semibold text-fg-1">Компоненты</h1>
        <p className="max-w-[72ch] text-body-lg text-fg-2">
          Карта всей библиотеки: {readyCount} компонентов уже работают, ещё {components.length - readyCount} спроектированы в Paper и ждут кода.
          Готовые — с живым превью, будущие — приглушены.
        </p>
        <SegmentedControl<Filter>
          aria-label="Показать"
          className="self-start"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: `Все · ${components.length}` },
            { value: 'ready', label: `Готовые · ${readyCount}` },
            { value: 'planned', label: `Скоро · ${components.length - readyCount}` },
          ]}
        />
      </header>
      {groups.map(({ category, items }) => (
        <section key={category.id} aria-labelledby={`category-${category.id}`} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <h2 id={`category-${category.id}`} className="text-heading-lg font-semibold text-fg-1">
                {category.title}
              </h2>
              <span className="text-caption text-fg-3 tabular-nums">
                {category.components.filter(isReady).length} из {category.components.length}
              </span>
            </div>
            <p className="max-w-[72ch] text-body-sm text-fg-2">{category.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3 min-[1800px]:grid-cols-4">
            {items.map((meta) => (isReady(meta) ? <ReadyCard key={meta.id} meta={meta} /> : <PlannedCard key={meta.id} meta={meta} />))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
