import { Card, CardHeader, ScatterChart } from '@/kvant';

const managers = [
  { label: 'Анна', x: 198, y: 20 },
  { label: 'Олег', x: 127, y: 12 },
  { label: 'Ирина', x: 301, y: 32 },
  { label: 'Павел', x: 198, y: 19 },
  { label: 'Мария', x: 309, y: 32 },
  { label: 'Дмитрий', x: 319, y: 33 },
  { label: 'Светлана', x: 237, y: 24 },
  { label: 'Игорь', x: 123, y: 9 },
  { label: 'Ольга', x: 260, y: 36, callout: true },
  { label: 'Кирилл', x: 188, y: 18 },
  { label: 'Наталья', x: 120, y: 14 },
  { label: 'Артём', x: 113, y: 13 },
  { label: 'Елена', x: 209, y: 30 },
  { label: 'Сергей', x: 96, y: 3, callout: true },
  { label: 'Юлия', x: 278, y: 28 },
  { label: 'Максим', x: 307, y: 29 },
];

export default function ChartCorrelationRegression() {
  return (
    <Card className="w-full">
      <CardHeader title="Звонки и закрытые сделки" description="Октябрь 2026 · 16 менеджеров · линия МНК и 95 % доверительная полоса" />
      <ScatterChart
        aria-label="Звонки и закрытые сделки по менеджерам"
        xName="Звонков"
        yName="Сделок"
        xUnit="звонков"
        formatXTick={String}
        trend="linear"
        band
        series={[{ name: 'Менеджер', points: managers }]}
      />
    </Card>
  );
}
