import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'navigation-progress',
  status: 'stable',
  title: 'Прогресс перехода',
  description:
    'Тонкая полоса по верхнему краю окна при переходе между страницами. Появляется, только если переход дольше 150 мс; старая страница стоит на месте и не мигает.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['Полоса 3 px поверх всего', 'Заполнение accent со скруглённым правым концом'],
  related: ['progress', 'spinner', 'skeleton'],
  source: { file: 'components/progress.tsx', exports: ['NavigationProgress'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'loading', type: 'boolean', default: false, description: 'Идёт переход: true на старте навигации, false, когда страница готова.' },
  ],
  slots: [{ name: 'navigation-progress', description: 'Полоса; data-state="loading" | "done". Скрыта от диктора.' }],
  states: [
    { id: 'loading', label: 'в пути', description: 'Через 150 мс — сразу 15 %, дальше +2…8 % каждые 400 мс, не выше 90 %.' },
    { id: 'rest', label: 'готово', description: 'Добегает до 100 % и гаснет за 200 мс.' },
  ],
  keyboard: [],
  a11y: [
    'Полоса декоративная: aria-busy ставьте на основную область страницы, а не на неё.',
    'Без свечения и пульсации — только ширина и прозрачность.',
  ],
  motion: [
    { label: 'Старт', value: 'через 150 мс · 0 → 15 % · 200 мс · ease-out' },
    { label: 'Трикл', value: '+2…8 % каждые 400 мс до 90 %: чем ближе, тем медленнее' },
    { label: 'Финиш', value: 'до 100 % за 200 мс, затем прозрачность 0 за 200 мс' },
    { label: 'Сниженное движение', value: 'только финальное исчезновение' },
  ],
  examples: [
    { id: 'router', title: 'Переход между разделами', description: 'Полоса над страницей, пока грузится следующая.' },
    { id: 'fast', title: 'Быстрый переход', description: 'Короче 150 мс — полоса не появляется.' },
  ],
};

export default meta;
