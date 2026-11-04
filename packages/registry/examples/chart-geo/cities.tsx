import { BubbleMap, Card, CardHeader } from '@/kvant';
import { cityOrders } from './data';

export default function ChartGeoCities() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Заказы по городам" description="Октябрь 2026 · кружок в центре региона, площадь — заказы" />
      <BubbleMap aria-label="Заказы за месяц по городам" data={cityOrders} valueLabel="Заказов за месяц" />
    </Card>
  );
}
