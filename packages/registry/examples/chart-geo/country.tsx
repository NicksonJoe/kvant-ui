import { Card, CardHeader, PinMap, RUSSIA_BASEMAP } from '@/kvant';
import { countryPoints } from './data';

export default function ChartGeoCountry() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Точки самовывоза по стране" description={`Октябрь 2026 · ${countryPoints.length} точек · при отдалении соседние пины собираются в кластер`} />
      <PinMap aria-label="Пункты выдачи по регионам" points={countryPoints} basemap={RUSSIA_BASEMAP} cluster />
    </Card>
  );
}
