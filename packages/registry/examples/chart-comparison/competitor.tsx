import { Card, CardHeader, RadarChart } from '@/kvant';

export default function ChartComparisonCompetitor() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Оценка против конкурента" description="Опрос клиентов, октябрь 2026 · баллы из 100" />
      <RadarChart
        aria-label="Оценка нашей компании и конкурента по шести критериям"
        max={100}
        axes={['Цена', 'Качество', 'Сервис', 'Доставка', 'Ассортимент', 'Бренд']}
        series={[
          { name: 'Мы', values: [80, 65, 90, 55, 70, 60] },
          { name: 'Конкурент', values: [60, 85, 70, 75, 50, 80] },
        ]}
      />
    </Card>
  );
}
