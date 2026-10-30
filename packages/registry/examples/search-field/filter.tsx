import { useEffect, useRef, useState } from 'react';
import { SearchField } from '@/kvant';

const projects = [
  'Ребрендинг «Студии Север»',
  'Сайт для «Орбита Лаб»',
  'Упаковка для «Хлебницы»',
  'Каталог «Северной мануфактуры»',
  'Вывеска для кофейни «Зерно»',
];

const plural = new Intl.PluralRules('ru');
const projectWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'проект', few: 'проекта' };

export default function SearchFieldFilter() {
  const [found, setFound] = useState(projects);
  const [loading, setLoading] = useState(false);
  const answer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(answer.current), []);

  return (
    <div className="flex w-80 max-w-full flex-col gap-3">
      <SearchField
        aria-label="Поиск по проектам"
        placeholder="Поиск по проектам"
        loading={loading}
        onSearch={(query) => {
          setLoading(true);
          clearTimeout(answer.current);
          // Stand-in for the server: answers in 400 ms.
          answer.current = setTimeout(() => {
            const needle = query.trim().toLocaleLowerCase('ru');
            setFound(projects.filter((project) => project.toLocaleLowerCase('ru').includes(needle)));
            setLoading(false);
          }, 400);
        }}
      />
      <p aria-live="polite" className="text-caption text-fg-3">
        {found.length > 0 ? `Найдено: ${found.length} ${projectWords[plural.select(found.length)] ?? 'проектов'}` : 'Ничего не найдено'}
      </p>
      <ul className="flex flex-col">
        {found.map((project) => (
          <li key={project} className="border-b border-separator py-2.5 text-body-sm text-fg-1 last:border-b-0">
            {project}
          </li>
        ))}
      </ul>
    </div>
  );
}
