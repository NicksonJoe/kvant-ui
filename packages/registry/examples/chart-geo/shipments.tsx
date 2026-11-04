import { Card, CardHeader, FlowMap } from '@/kvant';
import { shipments } from './data';

export default function ChartGeoShipments() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Отгрузки со складов" description="Неделя 44 · линия — маршрут склад → регион, толщина — объём" />
      <FlowMap aria-label="Отгрузки со складов по регионам за неделю" flows={shipments} valueLabel="Отправлений в неделю" />
    </Card>
  );
}
