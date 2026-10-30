import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'carousel',
  status: 'stable',
  title: 'Карусель',
  description:
    'Лента слайдов, которая доводится до края. Следующий слайд всегда выглядывает — это и есть подсказка, что ленту можно листать. Стрелки дублируют свайп и клавиши, точки показывают позицию.',
  category: 'data-display',
  paperBoard: 'G16-0',
  anatomy: ['Заголовок и описание', 'Стрелки secondary 36', 'Лента со snap', 'Слайд 400, r20, зазор 16', 'Точки 6, текущая 18 × 6'],
  related: ['card', 'scroll-area', 'image'],
  source: { file: 'components/carousel.tsx', exports: ['Carousel', 'CarouselSlide'] },
  dependencies: { npm: ['lucide-react', '@base-ui/react'], registry: ['button'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название карусели для экранного диктора.' },
    { name: 'title', type: 'node', description: 'Заголовок над лентой; стрелки встают справа от него.' },
    { name: 'description', type: 'node', description: 'Подзаголовок 16/24 fg-2.' },
    { name: 'slideWidth', type: 'number', options: [224, 320, 400], default: 400, description: 'Ширина слайда, px; на узком экране остаётся 64 под соседний слайд.' },
  ],
  parts: [{ name: 'CarouselSlide', description: 'Слайд: 400 в ширину, на узком экране — оставляет 64 под выглядывающий соседний.', props: [] }],
  slots: [
    { name: 'carousel', description: 'Корень section с aria-roledescription «карусель».' },
    { name: 'carousel-slide', description: 'Слайд: group «1 из 6» с aria-roledescription «слайд».' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Первый слайд у края, «назад» недоступна.' },
    { id: 'disabled', label: 'край ленты', description: 'Стрелка на краю — прозрачность 50 %.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Стрелки, затем лента и содержимое слайдов' },
    { keys: ['←', '→'], action: 'В фокусе ленты: соседний слайд' },
  ],
  a11y: [
    'Карусель — section с названием; каждый слайд — группа «N из M».',
    'Точки декоративные: позицию сообщают названия слайдов.',
    'Без автопрокрутки: лента движется только по действию человека.',
  ],
  motion: [
    { label: 'Доводка к слайду', value: 'scroll-snap; плавная прокрутка, при reduced motion — мгновенно' },
    { label: 'Свайп', value: '1:1 за пальцем' },
    { label: 'Точка', value: 'растягивается в капсулу, spring-snappy' },
  ],
  examples: [
    { id: 'cases', title: 'Кейсы клиентов', description: 'Карточки с иллюстрацией и подписью.' },
    { id: 'templates', title: 'Шаблоны', description: 'Компактная лента без заголовка.' },
  ],
};

export default meta;
