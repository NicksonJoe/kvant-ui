import { SiteFooter } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const mark = (
  <svg aria-hidden width={24} height={24} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" className="stroke-fg-1" strokeWidth="2" />
    <circle cx="18.36" cy="5.64" r="3.25" className="fill-accent stroke-background" strokeWidth="2" />
  </svg>
);

const columns = [
  { title: 'Продукт', links: [{ label: 'Возможности', href: '#features' }, { label: 'Тарифы', href: '#pricing' }, { label: 'Интеграции', href: '#integrations' }] },
  { title: 'Клиентам', links: [{ label: 'Справка', href: '#help' }, { label: 'API', href: '#api' }] },
  { title: 'Компания', links: [{ label: 'О Норде', href: '#about' }, { label: 'Вакансии', href: '#jobs', count: 3 }] },
];

const links = [
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Документация', href: '#docs' },
  { label: 'Оферта', href: '#offer' },
];

const playground: Playground = {
  render: (p) => (
    <div className="w-full overflow-hidden rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <SiteFooter
        variant={p.pick('variant', ['full', 'compact'] as const)}
        logo={
          <a href="#top" className="flex items-center gap-2 text-[17px]/[22px] font-semibold tracking-[-0.01em] text-fg-1">
            {mark}
            {p.pick('variant', ['full', 'compact'] as const) === 'full' ? 'Норда' : null}
          </a>
        }
        description="CRM для студий и агентств: от первой заявки до закрывающих документов."
        columns={columns}
        links={links}
        legal="© 2026 Норда"
      />
    </div>
  ),
  code: (p) => `<SiteFooter${p.attrs(['variant'])} logo={logo} columns={columns} legal="© 2026 Норда" />`,
};

export default playground;
