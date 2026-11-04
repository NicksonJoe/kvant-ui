import { Card, CardHeader, SankeyChart } from '@/kvant';

export const journeyNodes = [
  { id: 'search', label: 'Поиск' },
  { id: 'ads', label: 'Реклама' },
  { id: 'social', label: 'Соцсети' },
  { id: 'partners', label: 'Партнёры' },
  { id: 'site', label: 'Сайт' },
  { id: 'app', label: 'Приложение' },
  { id: 'purchase', label: 'Покупка' },
  { id: 'left', label: 'Ушли' },
];

export const journeyLinks = [
  { source: 'search', target: 'site', value: 3_000 },
  { source: 'search', target: 'app', value: 1_200 },
  { source: 'ads', target: 'site', value: 1_900 },
  { source: 'ads', target: 'app', value: 1_200 },
  { source: 'social', target: 'site', value: 900 },
  { source: 'social', target: 'app', value: 1_000 },
  { source: 'partners', target: 'site', value: 600 },
  { source: 'partners', target: 'app', value: 200 },
  { source: 'site', target: 'purchase', value: 341 },
  { source: 'site', target: 'left', value: 6_059 },
  { source: 'app', target: 'purchase', value: 249 },
  { source: 'app', target: 'left', value: 3_351 },
];

export const journeyLegend = [
  { name: 'Источник', color: 'var(--color-chart-1)' },
  { name: 'Поток к покупке', color: 'var(--color-seq-2)' },
  { name: 'Остальные потоки', color: 'var(--color-fill-3)' },
];

export default function ChartFlowSankey() {
  return (
    <Card className="w-full">
      <CardHeader title="Путь клиента" description="Октябрь 2026 · 10 000 сессий: откуда пришли, где были, чем закончилось" />
      <SankeyChart aria-label="Путь клиента, октябрь 2026" nodes={journeyNodes} links={journeyLinks} highlight="purchase" legend={journeyLegend} />
    </Card>
  );
}
