import { Card, CardHeader, Dendrogram } from '@/kvant';

const pair = (height: number, a: string, b: string) => ({ height, children: [{ label: a }, { label: b }] });

const baskets = {
  height: 6.4,
  children: [
    { label: 'Хозтовары', ...pair(1.05, 'Порошок', 'Губки') },
    {
      height: 4.2,
      children: [
        { label: 'Завтрак', height: 1.1, children: [pair(0.05, 'Печенье', 'Шоколад'), { height: 0.6, children: [{ label: 'Сахар' }, pair(0.15, 'Кофе', 'Чай')] }] },
        {
          label: 'Молочное и хлеб',
          height: 1.5,
          children: [{ label: 'Хлеб' }, { height: 0.95, children: [{ label: 'Сыр' }, { height: 0.5, children: [{ label: 'Молоко' }, pair(0.4, 'Йогурт', 'Масло')] }] }],
        },
      ],
    },
  ],
};

export default function ChartHierarchyBaskets() {
  return (
    <Card className="w-full">
      <CardHeader title="Какие товары покупают вместе" description="Октябрь 2026 · 12 категорий, иерархическая кластеризация по корзинам" />
      <Dendrogram aria-label="Кластеры категорий по совместным покупкам, октябрь 2026" data={baskets} cut={2} />
    </Card>
  );
}
