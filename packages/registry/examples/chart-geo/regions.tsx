import { Card, CardHeader, TileMap } from '@/kvant';
import { regionOrders } from './data';

export default function ChartGeoRegions() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Заказы по регионам" description="Октябрь 2026 · плиточная карта: каждый регион одного размера" />
      <TileMap aria-label="Заказы на 10 тысяч жителей по регионам" data={regionOrders} thresholds={[5, 10, 20, 40]} valueLabel="Заказов на 10 тыс жителей" />
    </Card>
  );
}
