import { Card, CardHeader, StackedBar } from '@/kvant';

export default function ChartShares() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader title="Откуда приходят сделки" description="312 сделок за квартал" />
      <StackedBar
        aria-label="Источники сделок за квартал"
        data={[
          { label: 'Сайт', value: 132 },
          { label: 'Telegram', value: 84 },
          { label: 'Рекомендации', value: 61 },
          { label: 'Реклама', value: 35 },
        ]}
      />
    </Card>
  );
}
