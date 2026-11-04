import { Card, CardHeader, PinMap } from '@/kvant';
import { pickupPoints } from './data';

export default function ChartGeoPickup() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Точки самовывоза в Москве" description="Октябрь 2026 · каждая точка — отдельный адрес" />
      <PinMap
        aria-label="Пункты выдачи, магазины и склады в Москве"
        points={pickupPoints}
        categories={[{ name: 'Пункт выдачи' }, { name: 'Магазин' }, { name: 'Склад', color: 'var(--color-fg-1)', marker: 'square' }]}
      />
    </Card>
  );
}
