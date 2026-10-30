import { CircleDashed } from 'lucide-react';
import { Link } from 'react-router';
import { buttonClasses } from '@/kvant';
import { getComponent, isReady, type ComponentMeta } from '@/kvant/meta';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PrevNext } from '../components/PrevNext';
import { StatusBadge } from '../components/StatusBadge';
import { PageShell } from '../layouts/SidebarLayout';
import { PaperLink } from '../components/PaperLink';
import { categoryOf, neighbours } from '../lib/registry';

/** «В работе»: designed in Paper, not built yet. */
export function PlannedPage({ meta }: { meta: ComponentMeta }) {
  const category = categoryOf(meta);
  const { prev, next } = neighbours(meta);
  const readyNearby = category.components.filter(isReady).slice(0, 6);
  const related = (meta.related ?? []).map((id) => getComponent(id)).filter((item): item is ComponentMeta => item !== undefined);
  const alternatives = related.length > 0 ? related : readyNearby;

  return (
    <PageShell
      toc={[
        { id: 'status', title: 'В работе' },
        ...(meta.anatomy ? [{ id: 'anatomy', title: 'Анатомия' }] : []),
        ...(alternatives.length > 0 ? [{ id: 'meanwhile', title: 'Пока можно взять' }] : []),
      ]}
    >
      <header className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: 'Компоненты', to: '/components' }, { label: category.title, to: `/components#category-${category.id}` }, { label: meta.title }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-sm font-semibold text-fg-1">{meta.title}</h1>
          <StatusBadge status="planned" />
        </div>
        <p className="max-w-[72ch] text-body-lg text-fg-2">{meta.description}</p>
      </header>

      <section id="status" aria-label="В работе" className="flex max-w-3xl items-start gap-4 rounded-2xl bg-surface-2 p-6">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-1 text-fg-3 shadow-raised">
          <CircleDashed className="size-5 stroke-[1.5]" />
        </span>
        <div className="flex flex-col gap-3">
          <h2 className="text-heading-sm font-semibold text-fg-1">В работе</h2>
          <p className="text-body-sm text-fg-2">
            Компонент спроектирован в Paper — там его варианты, состояния и размеры. Код, живые примеры и Playground появятся, когда он
            будет готов; адрес этой страницы не изменится.
          </p>
          <div>
            <PaperLink meta={meta} />
          </div>
        </div>
      </section>

      {meta.anatomy ? (
        <section aria-labelledby="anatomy" className="flex flex-col gap-4">
          <h2 id="anatomy" className="text-heading-lg font-semibold text-fg-1">
            Анатомия
          </h2>
          <ol className="flex max-w-3xl flex-col divide-y divide-separator rounded-xl bg-surface-1 shadow-raised">
            {meta.anatomy.map((part, index) => (
              <li key={part} className="flex items-center gap-4 px-5 py-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill-2 text-caption font-medium text-fg-2 tabular-nums">
                  {index + 1}
                </span>
                <span className="text-body-sm text-fg-1">{part}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {alternatives.length > 0 ? (
        <section aria-labelledby="meanwhile" className="flex flex-col gap-4">
          <h2 id="meanwhile" className="text-heading-lg font-semibold text-fg-1">
            Пока можно взять
          </h2>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((item) => (
              <Link
                key={item.id}
                to={`/components/${item.id}`}
                className={buttonClasses({ variant: isReady(item) ? 'secondary' : 'ghost', size: 'sm' })}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <PrevNext prev={prev} next={next} />
    </PageShell>
  );
}
