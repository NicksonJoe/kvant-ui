import { TableOfContents } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const items = [
  { id: 'toc-playground-prepare', label: 'Подготовка' },
  { id: 'toc-playground-export', label: 'Экспорт из старой системы' },
  { id: 'toc-playground-mapping', label: 'Сопоставление полей' },
  { id: 'toc-playground-contacts', label: 'Контакты', level: 3 },
  { id: 'toc-playground-deals', label: 'Сделки', level: 3 },
  { id: 'toc-playground-duplicates', label: 'Проверка дублей' },
  { id: 'toc-playground-run', label: 'Запуск импорта' },
] as const;

const playground: Playground = {
  render: (p) => (
    <TableOfContents items={items} title={p.text('title')} offset={p.num('offset')} backToTop={p.bool('backToTop')} className="w-60" />
  ),
  code: (p) => `<TableOfContents items={sections}${p.attrs(['title', 'offset', 'backToTop'])} />`,
};

export default playground;
