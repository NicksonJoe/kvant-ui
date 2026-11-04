import { Card, CardHeader, SlopeChart } from '@/kvant';

const percent = (value: number) => `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

export default function ChartRankingChannels() {
  return (
    <Card className="w-full">
      <CardHeader title="Конверсия по каналам" description="Сентябрь → октябрь 2026 · фокус на канале, который вырос сильнее всех" />
      <SlopeChart
        aria-label="Конверсия заявок в сделки по каналам, сентябрь и октябрь 2026"
        periods={['Сентябрь', 'Октябрь']}
        focus="Сайт"
        formatValue={percent}
        data={[
          { label: 'Рекомендации', from: 5.2, to: 5.5 },
          { label: 'Партнёры', from: 4.4, to: 3.0 },
          { label: 'Реклама', from: 3.8, to: 2.1 },
          { label: 'Сайт', from: 2.4, to: 3.6 },
          { label: 'Соцсети', from: 1.3, to: 1.2 },
        ]}
      />
    </Card>
  );
}
