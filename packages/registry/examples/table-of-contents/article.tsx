import { useRef } from 'react';
import { TableOfContents, type TableOfContentsItem } from '@/kvant';

const sections: readonly (TableOfContentsItem & { text: string })[] = [
  { id: 'toc-article-prepare', label: 'Подготовка', text: 'Перед импортом выгрузите из старой системы три файла — контакты, сделки и пользователей. Норда принимает CSV и XLSX до 20 МБ.' },
  { id: 'toc-article-export', label: 'Экспорт из старой системы', text: 'В большинстве CRM выгрузка лежит в настройках, в разделе «Данные». Выгружайте всё сразу: связи между сделками и контактами Норда восстановит сама.' },
  { id: 'toc-article-mapping', label: 'Сопоставление полей', text: 'Норда сама узнаёт стандартные колонки: имя, телефон, почту, сумму и этап. Для остальных выберите поле вручную — или создайте новое прямо в мастере, без перехода в настройки.' },
  { id: 'toc-article-contacts', label: 'Контакты', level: 3, text: 'Если у контакта два телефона, разделите их точкой с запятой — оба попадут в карточку, первый станет основным.' },
  { id: 'toc-article-deals', label: 'Сделки', level: 3, text: 'Этапы воронки сопоставляются по названию. Незнакомый этап Норда предложит добавить в воронку или заменить ближайшим.' },
  { id: 'toc-article-fields', label: 'Пользовательские поля', level: 3, text: 'Списки, даты и суммы распознаются по первым ста строкам. Если тип угадан неверно, поменяйте его до запуска.' },
  { id: 'toc-article-duplicates', label: 'Проверка дублей', text: 'Дубли по почте и телефону Норда покажет отдельным списком перед загрузкой. Выберите, какую карточку оставить, или объедините их.' },
  { id: 'toc-article-run', label: 'Запуск импорта', text: 'Импорт идёт в фоне: можно закрыть мастер и продолжить работу. Когда он закончится, придёт уведомление со ссылкой на отчёт.' },
];

export default function TableOfContentsArticle() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className="h-[520px] w-full overflow-y-auto rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-separator bg-background px-6 text-label-lg font-semibold text-fg-1">
        Справка Норды
      </header>
      <div className="flex flex-col gap-6 px-6 pt-10 lg:flex-row-reverse lg:items-start lg:justify-between lg:gap-10 lg:pr-6 lg:pl-10">
        <TableOfContents items={sections} root={root} />
        <article className="flex max-w-[680px] min-w-0 flex-col gap-4 pb-[60vh]">
          <h1 className="text-heading-lg font-semibold text-fg-1">Импорт клиентов</h1>
          {sections.map((section) =>
            section.level === 3 ? (
              <section key={section.id} className="flex flex-col gap-2 pt-4">
                <h3 id={section.id} className="text-heading-xs font-semibold text-fg-1">
                  {section.label}
                </h3>
                <p className="text-body-md/7 text-fg-2">{section.text}</p>
              </section>
            ) : (
              <section key={section.id} className="flex flex-col gap-3 pt-8">
                <h2 id={section.id} className="text-heading-md font-semibold text-fg-1">
                  {section.label}
                </h2>
                <p className="text-body-md/7 text-fg-2">{section.text}</p>
                <div aria-hidden className="h-32 rounded-lg bg-fill-1" />
              </section>
            ),
          )}
        </article>
      </div>
    </div>
  );
}
