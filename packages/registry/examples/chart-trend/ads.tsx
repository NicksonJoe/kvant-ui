import { Card, CardHeader, ConnectedScatterChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

export default function ChartTrendAds() {
  return (
    <Card className="w-full">
      <CardHeader title="Реклама и выручка по месяцам" description="Ноябрь 2025 — октябрь 2026 · X — расходы на рекламу, Y — выручка, ₽" />
      <ConnectedScatterChart
        aria-label="Расходы на рекламу и выручка по месяцам"
        xName="Реклама"
        yName="Выручка"
        formatX={rub}
        formatY={rub}
        data={[
          { label: 'Ноя 2025', x: 800_000, y: 3_100_000 },
          { label: 'Дек 2025', x: 900_000, y: 3_600_000 },
          { label: 'Янв 2026', x: 1_100_000, y: 2_400_000, note: 'Янв — провал после праздников' },
          { label: 'Фев 2026', x: 1_000_000, y: 2_800_000 },
          { label: 'Мар 2026', x: 1_300_000, y: 3_300_000 },
          { label: 'Апр 2026', x: 1_500_000, y: 3_500_000 },
          { label: 'Май 2026', x: 1_600_000, y: 3_900_000 },
          { label: 'Июн 2026', x: 1_400_000, y: 4_100_000 },
          { label: 'Июл 2026', x: 1_800_000, y: 3_800_000 },
          { label: 'Авг 2026', x: 2_000_000, y: 4_400_000 },
          { label: 'Сен 2026', x: 2_100_000, y: 4_700_000 },
          { label: 'Окт 2026', x: 2_400_000, y: 5_200_000 },
        ]}
      />
    </Card>
  );
}
