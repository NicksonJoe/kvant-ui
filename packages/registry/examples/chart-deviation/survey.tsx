import { Card, CardHeader, LikertChart } from '@/kvant';

export default function ChartDeviationSurvey() {
  return (
    <Card className="w-full">
      <CardHeader title="Мнение о сервисе" description="Октябрь 2026 · 1 240 ответов, %" />
      <LikertChart
        aria-label="Ответы клиентов о сервисе, октябрь 2026"
        categories={['Нет', 'Скорее нет', 'Нейтрально', 'Скорее да', 'Да']}
        data={[
          { label: 'Легко найти товар', values: [4, 8, 14, 38, 36] },
          { label: 'Доставка вовремя', values: [3, 6, 11, 34, 46] },
          { label: 'Понятные цены', values: [9, 15, 18, 33, 25] },
          { label: 'Поддержка помогает', values: [12, 16, 20, 30, 22] },
          { label: 'Посоветую друзьям', values: [6, 9, 17, 35, 33] },
        ]}
      />
    </Card>
  );
}
