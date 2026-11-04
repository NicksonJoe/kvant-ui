import { ButterflyChart, Card, CardHeader } from '@/kvant';

export default function ChartDeviationClientsAge() {
  return (
    <Card className="w-full">
      <CardHeader title="Клиенты по возрасту" description="Активные клиенты, октябрь 2026 · новые и повторные" />
      <ButterflyChart
        aria-label="Новые и повторные клиенты по возрасту"
        labels={['18–24', '25–34', '35–44', '45–54', '55+']}
        left={{ name: 'Новые', values: [184, 412, 356, 198, 87] }}
        right={{ name: 'Повторные', values: [96, 538, 611, 402, 215] }}
      />
    </Card>
  );
}
