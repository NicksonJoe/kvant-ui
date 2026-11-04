import { Card, CardHeader, WordBarChart, type WordDatum } from '@/kvant';

const words: WordDatum[] = [
  { text: 'доставка', value: 142 },
  { text: 'быстро', value: 118, tone: 'positive' },
  { text: 'удобно', value: 96, tone: 'positive' },
  { text: 'курьер', value: 88 },
  { text: 'цена', value: 84 },
  { text: 'качество', value: 72, tone: 'positive' },
  { text: 'дорого', value: 61, tone: 'negative' },
  { text: 'поддержка', value: 58 },
  { text: 'долго', value: 54, tone: 'negative' },
  { text: 'приложение', value: 51 },
  { text: 'вежливо', value: 47, tone: 'positive' },
  { text: 'ошибка', value: 39, tone: 'negative' },
  { text: 'скидка', value: 37, tone: 'positive' },
  { text: 'упаковка', value: 34 },
];

export default function ChartTextFrequency() {
  return (
    <Card className="w-full">
      <CardHeader title="Частые слова в отзывах" description="Октябрь 2026 · топ-14 из 3 180 отзывов, упоминаний" />
      <WordBarChart aria-label="Топ-14 слов в отзывах клиентов за октябрь 2026" words={words} />
    </Card>
  );
}
