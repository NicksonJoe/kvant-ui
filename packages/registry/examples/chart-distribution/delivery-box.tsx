import { BoxPlotChart, Card, CardHeader } from '@/kvant';

const days = (value: number) => `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} дн`;

export default function ChartDistributionDeliveryBox() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Срок доставки по городам" description="Октябрь 2026 · дни от оплаты до вручения" />
      <BoxPlotChart
        aria-label="Срок доставки по городам за октябрь"
        unit="дн"
        boxLabel="50 % заказов"
        formatValue={days}
        groups={[
          { name: 'Москва', values: [0.8, 1.1, 1.2, 1.4, 1.5, 1.6, 1.6, 1.8, 2, 2.1, 2.3, 2.6, 3.4, 4.6] },
          { name: 'Санкт-Петербург', values: [0.9, 1.3, 1.6, 1.8, 1.9, 2, 2.1, 2.4, 2.7, 2.9, 3.2, 4.1, 5.8] },
          { name: 'Казань', values: [1.3, 1.8, 2.1, 2.3, 2.5, 2.7, 2.8, 3, 3.3, 3.5, 3.9, 4.4, 5] },
          { name: 'Екатеринбург', values: [1.5, 2.2, 2.5, 2.8, 3, 3.1, 3.3, 3.6, 4, 4.2, 4.6, 5.2, 6, 8.1, 8.6] },
          { name: 'Новосибирск', values: [1.9, 2.6, 3, 3.3, 3.6, 3.8, 4, 4.3, 4.6, 5, 5.6, 6.3, 7.2, 9.4] },
        ]}
      />
    </Card>
  );
}
