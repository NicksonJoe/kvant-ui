import { Card, CardHeader, ChordChart } from '@/kvant';

export const plans = [
  { id: 'start', label: 'Старт' },
  { id: 'business', label: 'Бизнес' },
  { id: 'pro', label: 'Про' },
  { id: 'corp', label: 'Корп' },
  { id: 'churn', label: 'Ушли', color: 'var(--color-fg-4)' },
];

export const planMoves = [
  { source: 'start', target: 'business', value: 320 },
  { source: 'start', target: 'pro', value: 80 },
  { source: 'start', target: 'churn', value: 260 },
  { source: 'business', target: 'start', value: 120 },
  { source: 'business', target: 'pro', value: 300 },
  { source: 'business', target: 'corp', value: 140 },
  { source: 'business', target: 'churn', value: 170 },
  { source: 'pro', target: 'start', value: 65 },
  { source: 'pro', target: 'business', value: 95 },
  { source: 'pro', target: 'corp', value: 90 },
  { source: 'pro', target: 'churn', value: 130 },
  { source: 'corp', target: 'business', value: 60 },
  { source: 'corp', target: 'churn', value: 20 },
];

export default function ChartFlowChord() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Переходы между тарифами" description="2026, клиенты · лента — поток из тарифа в тариф, ширина у дуги — его объём" />
      <ChordChart
        aria-label="Переходы клиентов между тарифами, 2026"
        groups={plans}
        flows={planMoves}
        highlight="business"
        legend={[
          { name: 'Из «Бизнеса»', color: 'var(--color-chart-2)' },
          { name: 'Остальные', color: 'var(--color-fill-3)' },
        ]}
      />
    </Card>
  );
}
