import { Card, CardHeader, WordCloudChart } from '@/kvant';

export default function ChartTextRequests() {
  return (
    <Card className="w-full">
      <CardHeader title="С чем пишут в чат" description="Неделя 43 · 612 обращений · без разметки тона" />
      <WordCloudChart
        aria-label="Частые слова в обращениях в чат поддержки, неделя 43"
        height={220}
        words={[
          { text: 'счёт', value: 96 },
          { text: 'оплата', value: 81 },
          { text: 'доступ', value: 64 },
          { text: 'интеграция', value: 52 },
          { text: 'тариф', value: 47 },
          { text: 'выгрузка', value: 38 },
          { text: 'пароль', value: 33 },
          { text: 'telegram', value: 29 },
          { text: 'отчёт', value: 24 },
          { text: 'сделка', value: 21 },
          { text: 'воронка', value: 17 },
          { text: 'импорт', value: 14 },
          { text: 'роли', value: 11 },
          { text: 'API', value: 9 },
        ]}
      />
    </Card>
  );
}
