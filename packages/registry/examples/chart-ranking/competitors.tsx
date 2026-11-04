import { Card, CardHeader, RankStripChart } from '@/kvant';

export default function ChartRankingCompetitors() {
  return (
    <Card className="w-full">
      <CardHeader title="Наше место среди конкурентов" description="Опрос клиентов, III квартал 2026 · 1 — лучший из 8" />
      <RankStripChart
        aria-label="Наше место среди восьми конкурентов по факторам выбора, III квартал 2026"
        places={8}
        previousLabel="Квартал назад"
        data={[
          { label: 'Цена', rank: 4, previous: 3 },
          { label: 'Скорость доставки', rank: 2, previous: 2 },
          { label: 'Ассортимент', rank: 5, previous: 6 },
          { label: 'Поддержка', rank: 1, previous: 3 },
          { label: 'Удобство сайта', rank: 3, previous: 5 },
          { label: 'Возвраты', rank: 6, previous: 4 },
        ]}
      />
    </Card>
  );
}
