import { CandlestickChart, Card, CardHeader } from '@/kvant';
import { october, rub } from './prices';

export default function ChartTrendCandles() {
  return (
    <Card className="w-full">
      <CardHeader title="Курс акции: свечи" description="Октябрь 2026, ₽ · открытие, закрытие, максимум и минимум дня" />
      <CandlestickChart aria-label="Курс акции за октябрь 2026, японские свечи" data={october} formatValue={rub} formatTick={rub} />
    </Card>
  );
}
