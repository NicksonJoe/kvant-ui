import { Card, CardHeader, HistogramChart, formatAxisValue } from '@/kvant';

// Сделки 2026 года по 25 тыс ₽ на интервал: сколько сделок попало в каждый
const counts = [4, 11, 23, 38, 46, 41, 30, 21, 14, 9, 5, 3];
const deals = counts.flatMap((count, bin) => Array.from({ length: count }, (_, i) => Math.round((bin + (i + 0.5) / count) * 25_000)));

export default function ChartDistributionDealSize() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Размер сделки" description="Сделки за 2026 год · шаг 25 тыс ₽ · число сделок" />
      <HistogramChart
        aria-label="Распределение сделок 2026 года по сумме"
        values={deals}
        step={25_000}
        countLabel="Сделок"
        formatValue={(value) => `${formatAxisValue(value)} ₽`}
      />
    </Card>
  );
}
