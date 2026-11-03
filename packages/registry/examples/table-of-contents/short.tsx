import { useRef } from 'react';
import { TableOfContents } from '@/kvant';

const sections = [
  { id: 'toc-short-terms', label: 'Предмет договора' },
  { id: 'toc-short-price', label: 'Стоимость и оплата' },
  { id: 'toc-short-data', label: 'Данные клиента' },
  { id: 'toc-short-end', label: 'Расторжение' },
];

export default function TableOfContentsShort() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className="h-[360px] w-full overflow-y-auto rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <div className="flex flex-col gap-6 p-6 lg:flex-row-reverse lg:items-start lg:justify-between lg:gap-16">
        <TableOfContents items={sections} root={root} title="Содержание" offset={24} backToTop={false} />
        <article className="flex max-w-[680px] min-w-0 flex-col gap-3 pb-[40vh]">
          <h1 className="text-heading-lg font-semibold text-fg-1">Оферта</h1>
          {sections.map((section, index) => (
            <section key={section.id} className="flex flex-col gap-2 pt-6">
              <h2 id={section.id} className="text-heading-sm font-semibold text-fg-1">
                {index + 1}. {section.label}
              </h2>
              <p className="text-body-md/7 text-fg-2">
                Исполнитель оказывает услуги по подписке, клиент оплачивает их по выбранному тарифу. Условия этого раздела действуют
                с момента оплаты и до конца оплаченного периода.
              </p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
