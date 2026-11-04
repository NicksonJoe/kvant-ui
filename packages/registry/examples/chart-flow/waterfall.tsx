import { Card, CardHeader, WaterfallChart } from '@/kvant';

export const planToFact = [
  { label: 'План', value: 5_000_000, total: true },
  { label: 'Новые клиенты', value: 900_000 },
  { label: 'Допродажи', value: 400_000 },
  { label: 'Отток', value: -700_000 },
  { label: 'Скидки', value: -300_000 },
  { label: 'Сезон', value: -200_000 },
  { label: 'Факт', total: true },
];

/** Millions with one decimal: «5,0», «0,9». */
export const millions = (value: number) => (value / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function ChartFlowWaterfall() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="От плана к факту" description="Октябрь 2026, млн ₽ · что добавило и что съело выручку" />
      <WaterfallChart aria-label="Выручка: от плана к факту, октябрь 2026" data={planToFact} formatValue={millions} />
    </Card>
  );
}
