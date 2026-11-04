import { Card, CardHeader, ViolinChart } from '@/kvant';

export default function ChartDistributionCheckViolin() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Средний чек по тарифам" description="Октябрь 2026, тыс ₽ · форма — плотность сделок" />
      <ViolinChart
        aria-label="Распределение среднего чека по тарифам, тыс ₽"
        bandwidth={6}
        groups={[
          { name: 'Старт', values: [12, 14, 15, 16, 17, 18, 19, 19, 20, 21, 21, 22, 22, 22, 23, 24, 25, 26, 27, 29, 31, 34, 38] },
          { name: 'Бизнес', values: [22, 26, 28, 30, 31, 33, 34, 35, 36, 36, 37, 37, 38, 39, 40, 41, 43, 45, 47, 50, 54, 58] },
          { name: 'Про', values: [34, 38, 41, 44, 46, 48, 49, 50, 51, 52, 53, 53, 54, 55, 56, 57, 59, 61, 63, 66, 70] },
          { name: 'Корп', values: [33, 38, 42, 46, 50, 53, 56, 58, 60, 62, 63, 63, 64, 66, 68, 70, 73, 77, 82, 88, 95] },
        ]}
      />
    </Card>
  );
}
