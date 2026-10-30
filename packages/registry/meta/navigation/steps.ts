import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'steps',
  status: 'stable',
  title: 'Шаги',
  description: 'Прохождение многошагового сценария. Пройденные шаги нажимаются, будущие — нет. Ошибка не прячет прогресс: шаг остаётся пройденным, но просит вернуться.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Метка 24: галочка, номер или «!»', 'Заголовок 14/20 500 (текущий 600)', 'Подпись 12/16 или 13/18 fg-3', 'Связка 2 px', 'Компактный: сегменты h4'],
  related: ['progress', 'tabs', 'form'],
  source: { file: 'components/steps.tsx', exports: ['Steps'] },
  dependencies: { npm: [], registry: [] },
  props: [
    {
      name: 'steps',
      type: 'object',
      required: true,
      signature: 'readonly { title; description?; error?; content?; disabled? }[]',
      description: 'Шаги; error — ошибка на пройденном шаге вместо подписи, content — что спрашивает текущий шаг (вертикальный вид).',
      control: false,
    },
    { name: 'current', type: 'number', options: [0, 1, 2, 3], default: 2, description: 'Текущий шаг, с нуля.' },
    { name: 'variant', type: 'enum', options: ['horizontal', 'vertical', 'compact'], default: 'horizontal', description: 'horizontal — шапка мастера; vertical — текущий шаг раскрыт; compact — телефон: заголовок и сегменты.' },
    { name: 'onStepClick', type: 'function', signature: '(index: number) => void', description: 'Делает пройденные шаги кнопками «вернуться».', control: false },
  ],
  slots: [{ name: 'steps', description: 'Корень; несёт data-variant. Шаги — упорядоченный список, у текущего aria-current="step".' }],
  states: [
    { id: 'checked', label: 'готово', description: 'Метка accent и галочка 14.' },
    { id: 'rest', label: 'текущий', description: 'Кольцо 2 accent и номер.' },
    { id: 'empty', label: 'впереди', description: 'surface-2 и номер fg-3.' },
    { id: 'invalid', label: 'ошибка', description: 'danger-soft с кольцом 1,5 и «!»; подпись danger-soft-fg.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring вокруг пройденного шага-кнопки.' },
    { id: 'disabled', label: 'отключён', description: 'Прозрачность 50 %.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по пройденным шагам-кнопкам' },
    { keys: ['Enter', 'Space'], action: 'Возвращает к пройденному шагу' },
  ],
  a11y: [
    'Шаги — упорядоченный список; текущий отмечен aria-current="step".',
    'Состояние каждого шага дублируется скрытым словом: «готово», «ошибка», «впереди».',
    'Компактный вид — progressbar «Шаг 3 из 4».',
  ],
  motion: [
    { label: 'Связка', value: 'заливка слева направо 300 мс ease-standard' },
    { label: 'Галочка', value: 'рисуется 150 мс ease-out' },
    { label: 'Раскрытие текущего шага', value: '200 мс ease-standard' },
  ],
  examples: [
    { id: 'wizard', title: 'Мастер подключения', description: 'Горизонтальные шаги с ошибкой на пройденном шаге.' },
    { id: 'vertical', title: 'Текущий шаг раскрыт', description: 'Вертикальный вид с выбором тарифа.' },
    { id: 'compact', title: 'Телефон', description: 'Заголовок, «Шаг 3 из 4» и сегменты.' },
  ],
};

export default meta;
