import { Card, CardHeader, DensityMap } from '@/kvant';
import { deliveryAddresses, densityLabels } from './data';

export default function ChartGeoCustomers() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Где живут покупатели" description="Октябрь 2026 · 4 050 адресов доставки, сглаженная плотность" />
      <DensityMap aria-label="Плотность адресов доставки в Москве" points={deliveryAddresses} labels={densityLabels} />
    </Card>
  );
}
