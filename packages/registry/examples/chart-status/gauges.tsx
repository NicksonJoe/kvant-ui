import { Card, CardHeader, GaugeChart } from '@/kvant';

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0');
const percent = (value: number) => `${value} %`;

export default function ChartStatusGauges() {
  return (
    <Card className="w-full">
      <CardHeader title="Спидометры" description="Октябрь 2026 · одно значение против цели на ограниченной шкале" />
      <div className="grid items-center gap-4 sm:grid-cols-[3fr_2fr]">
        <GaugeChart label="NPS за октябрь" value={62} min={-100} max={100} target={70} formatValue={signed} />
        <div className="grid min-w-0 gap-2">
          <GaugeChart size="sm" label="Загрузка склада" value={78} target={85} formatValue={percent} />
          <GaugeChart size="sm" label="Заказы в срок" value={92} target={90} formatValue={percent} />
        </div>
      </div>
    </Card>
  );
}
