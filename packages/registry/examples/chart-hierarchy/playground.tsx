import { Dendrogram, MindMap, OrgChart } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['org', 'dendrogram', 'mind-map'] as const;

const team = {
  title: 'Сергей Ким',
  subtitle: 'Продажи',
  value: 38,
  children: [
    { title: 'Опт', subtitle: 'Игорь Лаптев', value: 14, children: [{ title: 'Регионы', subtitle: 'Глеб Носов', value: 10 }, { title: 'Сети', subtitle: 'Вера Ким', value: 4 }] },
    { title: 'Розница', subtitle: 'Мария Орлова', value: 16 },
    { title: 'Маркетплейсы', subtitle: 'Дина Юсупова', value: 8 },
  ],
};

const playground: Playground = {
  controls: [{ name: 'kind', type: 'enum', options: kinds, default: 'org', description: 'Тип: оргструктура, дендрограмма или mind map.' }],
  render: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'dendrogram') {
      return (
        <Dendrogram
          aria-label="Кластеры категорий"
          className="w-full"
          cut={2}
          data={{
            height: 5,
            children: [
              { label: 'Хозтовары', height: 1, children: [{ label: 'Порошок' }, { label: 'Губки' }] },
              { label: 'Завтрак', height: 1.4, children: [{ label: 'Кофе' }, { label: 'Чай' }, { label: 'Печенье' }] },
            ],
          }}
        />
      );
    }
    if (kind === 'mind-map') {
      return (
        <MindMap
          aria-label="План запуска"
          className="w-full"
          data={{
            label: 'Запуск',
            children: [
              { label: 'Продукт', children: [{ label: 'Тариф «Про»' }, { label: 'Импорт из 1С' }] },
              { label: 'Продажи', children: [{ label: 'Скрипт демо' }, { label: 'Скидка до 31.12' }] },
            ],
          }}
        />
      );
    }
    return (
      <OrgChart
        aria-label="Отдел продаж"
        className="w-full"
        data={team}
        expandDepth={p.num('expandDepth')}
        layout={p.pick('layout', ['auto', 'tree', 'stack', 'indent'] as const)}
      />
    );
  },
  code: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'dendrogram') return `<Dendrogram\n  aria-label="Кластеры категорий"\n  cut={2}\n  data={{ height: 5, children: [{ label: 'Хозтовары', height: 1, children: [{ label: 'Порошок' }, { label: 'Губки' }] }, …] }}\n/>`;
    if (kind === 'mind-map') return `<MindMap\n  aria-label="План запуска"\n  data={{ label: 'Запуск', children: [{ label: 'Продукт', children: [{ label: 'Тариф «Про»' }] }, …] }}\n/>`;
    return `<OrgChart\n  aria-label="Отдел продаж"${p.attrs(['expandDepth', 'layout'])}\n  data={{ title: 'Сергей Ким', subtitle: 'Продажи', value: 38, children: […] }}\n/>`;
  },
};

export default playground;
