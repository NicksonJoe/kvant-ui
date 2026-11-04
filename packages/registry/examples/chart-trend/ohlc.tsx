import { Card, CardHeader, OhlcChart } from '@/kvant';
import { october, rub } from './prices';

export default function ChartTrendOhlc() {
  return (
    <Card className="w-full">
      <CardHeader title="Курс акции: OHLC" description="Те же данные: засечка слева — открытие, справа — закрытие" />
      <OhlcChart aria-label="Курс акции за октябрь 2026, бары OHLC" data={october} formatValue={rub} formatTick={rub} />
    </Card>
  );
}
