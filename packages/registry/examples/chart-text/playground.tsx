import { WordBarChart, WordCloudChart, type WordDatum } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['cloud', 'bars'] as const;
const names = { cloud: 'WordCloudChart', bars: 'WordBarChart' } as const;

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
  { text: 'вежливо', value: 47, tone: 'positive' },
  { text: 'ошибка', value: 39, tone: 'negative' },
  { text: 'скидка', value: 37, tone: 'positive' },
];

const playground: Playground = {
  controls: [
    { name: 'kind', type: 'enum', options: kinds, default: 'cloud', description: 'Облако слов для обзора или частотные полосы для точного сравнения.' },
    { name: 'tones', type: 'boolean', default: true, description: 'Тон слов цветом и легенда «Хвалят · Нейтрально · Ругают».' },
  ],
  render: (p) => {
    const data = p.bool('tones') ? words : words.map(({ text, value }) => ({ text, value }));
    return p.pick('kind', kinds) === 'cloud' ? (
      <WordCloudChart aria-label="О чём пишут в отзывах" words={data} />
    ) : (
      <WordBarChart aria-label="Частые слова в отзывах" words={data} />
    );
  },
  code: (p) => `<${names[p.pick('kind', kinds)]}
  aria-label="О чём пишут в отзывах"
  words={[
    { text: 'доставка', value: 142 },
    { text: 'быстро', value: 118${p.bool('tones') ? ", tone: 'positive'" : ''} },
    { text: 'дорого', value: 61${p.bool('tones') ? ", tone: 'negative'" : ''} },
  ]}
/>`,
};

export default playground;
