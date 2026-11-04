import { Card, CardHeader, WordCloudChart, type WordDatum } from '@/kvant';

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
  { text: 'рекомендую', value: 30, tone: 'positive' },
  { text: 'возврат', value: 29 },
  { text: 'опоздал', value: 27, tone: 'negative' },
  { text: 'ассортимент', value: 26 },
  { text: 'свежее', value: 25, tone: 'positive' },
  { text: 'не дозвониться', value: 22, tone: 'negative' },
  { text: 'бонусы', value: 21, tone: 'positive' },
  { text: 'сайт', value: 19 },
  { text: 'размер', value: 17 },
  { text: 'спасибо', value: 16, tone: 'positive' },
];

export default function ChartTextReviews() {
  return (
    <Card className="w-full">
      <CardHeader title="О чём пишут в отзывах" description="Октябрь 2026 · 3 180 отзывов · размер — частота, цвет — тон" />
      <WordCloudChart aria-label="Частые слова в отзывах клиентов, октябрь 2026" words={words} />
    </Card>
  );
}
