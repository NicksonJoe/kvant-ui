import { Link } from 'react-router';
import { buttonClasses } from '@/kvant';
import { categories, isReady, type ReadyComponentMeta } from '@/kvant/meta';
import { ForcedState } from '../components/ForcedState';
import { CompareSwitch, MODES, MODE_NAMES, ThemeScope } from '../components/Stage';
import { PageShell } from '../layouts/SidebarLayout';
import { ACCENT_NAMES, useEnvironment } from '../lib/environment';
import { usePreview } from '../lib/preview';
import { getPlayground, pluralize, renderPlayground } from '../lib/registry';
import { stateLanes } from '../lib/states';

const groups = categories
  .map((category) => ({ category, items: category.components.filter(isReady) }))
  .filter((group) => group.items.length > 0);
const total = groups.reduce((sum, group) => sum + group.items.length, 0);

/** «Проверка»: every ready component in its key states, in the current theme or light and dark side by side. */
export function CheckPage() {
  const [{ compare }] = usePreview();
  const [theme] = useEnvironment();

  return (
    <main id="content">
      <PageShell toc={groups.map(({ category }) => ({ id: `check-${category.id}`, title: category.title }))}>
        <header className="flex flex-col gap-4">
          <h1 className="text-display-sm font-semibold text-fg-1">Проверка</h1>
          <p className="max-w-[72ch] text-body-lg text-fg-2">
            Все готовые компоненты в ключевых состояниях — быстрый осмотр перед релизом. Наведение, нажатие и фокус включены
            принудительно, остальное — свойствами. Тема, шрифт, форма и плотность берутся из «Среды».
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <CompareSwitch />
            <span className="text-body-sm text-fg-3">
              {pluralize(total, { one: 'компонент', few: 'компонента', many: 'компонентов' })} · тема «{ACCENT_NAMES[theme.accent]}»
            </span>
          </div>
          <nav aria-label="Категории" className="flex flex-wrap gap-1.5">
            {groups.map(({ category }) => (
              <a key={category.id} href={`#check-${category.id}`} className={buttonClasses({ variant: 'outline', size: 'xs' })}>
                {category.title}
              </a>
            ))}
          </nav>
        </header>
        {groups.map(({ category, items }) => (
          <section key={category.id} aria-labelledby={`check-${category.id}`} className="flex flex-col gap-6">
            <h2 id={`check-${category.id}`} className="text-heading-lg font-semibold text-fg-1">
              {category.title}
            </h2>
            {items.map((meta) => (
              <CheckRow key={meta.id} meta={meta} compare={compare} />
            ))}
          </section>
        ))}
      </PageShell>
    </main>
  );
}

function CheckRow({ meta, compare }: { meta: ReadyComponentMeta; compare: boolean }) {
  // wraps rather than scrolls: a check must not hide a state off-screen
  const strip = !getPlayground(meta.id) ? (
    <p className="p-4 text-body-sm text-fg-3">Нет playground — показывать нечего.</p>
  ) : (
    <div className="flex flex-wrap gap-x-6 gap-y-5 overflow-x-auto p-4">
      {stateLanes(meta).map((lane) => (
        <figure key={lane.key} className="flex min-w-32 shrink-0 flex-col gap-3">
          <figcaption className="flex flex-col gap-0.5">
            <span className="text-caption font-medium text-fg-2">{lane.label}</span>
            <span className="font-mono text-overline text-fg-3">{lane.selector}</span>
          </figcaption>
          <div className="flex min-h-11 items-center">
            <ForcedState state={lane.forced}>{renderPlayground(meta, lane.props)}</ForcedState>
          </div>
        </figure>
      ))}
    </div>
  );
  const heading = `check-row-${meta.id}`;

  return (
    <section aria-labelledby={heading} className="flex flex-col gap-2">
      <h3 id={heading} className="text-heading-xs font-semibold">
        <Link to={`/components/${meta.id}?tab=states`} className="text-fg-1 underline-offset-3 hover:underline">
          {meta.title}
        </Link>
      </h3>
      {compare ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {MODES.map((mode) => (
            <ThemeScope key={mode} mode={mode} className="flex min-w-0 flex-col rounded-xl bg-background shadow-raised">
              <span className="px-4 pt-3 text-caption text-fg-3">{MODE_NAMES[mode]}</span>
              {strip}
            </ThemeScope>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-surface-1 shadow-raised">{strip}</div>
      )}
    </section>
  );
}
