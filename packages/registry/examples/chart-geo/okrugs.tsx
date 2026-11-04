import { Card, CardHeader, ChoroplethMap } from '@/kvant';
import { okrugRepeat } from './data';

export default function ChartGeoOkrugs() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Повторные заказы по округам" description="Октябрь 2026 · доля клиентов, заказавших второй раз, внутри МКАД" />
      <ChoroplethMap
        aria-label="Доля повторных заказов по округам Москвы"
        data={okrugRepeat}
        thresholds={[10, 15, 25, 35]}
        valueLabel="Повторных заказов, %"
      />
    </Card>
  );
}
