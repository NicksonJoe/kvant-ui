import { BarList, Card, CardHeader } from '@/kvant';

const rub = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;

export default function ChartRanking() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader title="Выручка по менеджерам" description="Октябрь, оплаченные счета" />
      <BarList
        aria-label="Выручка по менеджерам за октябрь"
        formatValue={rub}
        data={[
          { label: 'Анна Северова', value: 4_820_000 },
          { label: 'Вера Лебедева', value: 3_160_000 },
          { label: 'Илья Громов', value: 2_240_000 },
          { label: 'Пётр Ильин', value: 960_000 },
        ]}
      />
    </Card>
  );
}
