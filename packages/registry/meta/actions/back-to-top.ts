import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'back-to-top',
  status: 'beta',
  title: 'Кнопка «Наверх»',
  description:
    'Плавающая кнопка для длинных страниц — статей, справки, длинных таблиц. Появляется, когда пользователь ушёл вниз больше чем на два экрана, и прячется выше первого: между ними остаётся как была, поэтому не мигает. Кольцо прогресса показывает долю прочитанного. На телефоне видна, только пока страницу тянут вверх. В рабочих экранах с липкой шапкой не нужна — шапка и так рядом.',
  category: 'actions',
  paperBoard: '1DQ9-0',
  anatomy: [
    'Док: fixed, справа снизу 24; на телефоне 16 от края и над home indicator, с Fab — по его оси, на 12 выше',
    'Кнопка: круг 44 overlay, на телефоне 40 с зоной касания 44; капсула h40 с отступами 14 / 16',
    'Стрелка вверх 18 (в капсуле 16), штрих 2, fg-1',
    'Тень плавающая: hairline + 0 2 4 + 0 8 20 −6',
    'Кольцо прогресса 2,5: дорожка fill-3, дуга accent от 12 часов по часовой',
  ],
  related: ['fab', 'toast', 'table-of-contents', 'site-footer', 'button'],
  source: { file: 'components/back-to-top.tsx', exports: ['BackToTop', 'scrollToTop'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['portal'] },
  props: [
    {
      name: 'variant',
      type: 'enum',
      options: ['icon', 'label', 'progress'],
      default: 'icon',
      description: 'icon — круг 44, по умолчанию · label — капсула «Наверх» для статей и справки · progress — круг с кольцом доли прочитанного.',
    },
    { name: 'label', type: 'string', default: 'Наверх', description: 'Имя кнопки: у круга — aria-label, у капсулы — видимая подпись.' },
    {
      name: 'visible',
      type: 'boolean',
      description: 'Не задано — следит за прокруткой. false прячет её глубоко внизу (открыта панель массовых действий), true показывает сразу (демо).',
    },
    {
      name: 'progress',
      type: 'number',
      control: false,
      description: 'Своя доля 0–1 для кольца вместо положения прокрутки: например, только статья без комментариев под ней.',
    },
    {
      name: 'root',
      type: 'object',
      signature: 'RefObject<HTMLElement | null>',
      control: false,
      description: 'Контейнер с прокруткой: за ним следит и его возвращает наверх. По умолчанию — окно.',
    },
    {
      name: 'footer',
      type: 'object',
      signature: 'RefObject<HTMLElement | null>',
      control: false,
      description: 'Подвал сайта: когда он показывается, кнопка едет вверх вместе с его верхним краем и остаётся на 24 выше него.',
    },
    { name: 'fab', type: 'boolean', default: false, description: 'На экране есть Fab: на телефоне кнопка встаёт над ним по его оси, зазор 12.' },
    {
      name: 'placement',
      type: 'enum',
      options: ['fixed', 'absolute', 'inline'],
      description:
        'fixed — правый нижний угол окна (по умолчанию без root) · absolute — тот же угол ближайшего блока с position, для контейнера с прокруткой в обёртке relative (по умолчанию с root) · inline — в потоке, без смещений.',
    },
    { name: 'onClick', type: 'function', signature: '(event) => void', control: false, description: 'До прокрутки; event.preventDefault() оставляет страницу на месте.' },
    { name: 'style', type: 'object', signature: 'CSSProperties', control: false, description: 'Другой угол: style={{ bottom: 96 }} над своей нижней панелью. Классы смещения не перебивают.' },
    { name: 'className', type: 'string', control: false, description: 'Классы дока для раскладки.' },
  ],
  parts: [
    {
      name: 'scrollToTop',
      description:
        'То же действие без кнопки: плавно наверх (при сниженном движении — сразу) и фокус на первый h1 страницы или контейнера, без кольца. Им же пользуется «Наверх» в оглавлении.',
      props: [{ name: 'root', type: 'object', signature: 'HTMLElement | null', description: 'Контейнер с прокруткой; без него — окно.' }],
    },
  ],
  slots: [
    { name: 'back-to-top', description: 'Док: положение, появление и скрытие. Несёт data-visible, data-variant, data-fab, inert, пока скрыт, и --kv-lift у подвала.' },
    { name: 'back-to-top-button', description: 'Кнопка: фон, тень, наведение, нажатие, фокус.' },
    { name: 'back-to-top-progress', description: 'Дуга кольца: stroke-dasharray = доля × 100 из pathLength 100.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'overlay, плавающая тень; дуга accent.' },
    { id: 'hover', label: 'наведение', description: 'surface-2, тень поднимается до 0 12 24 −6; дуга accent-hover.', selector: ':hover · surface-2' },
    { id: 'pressed', label: 'нажатие', description: 'surface-3, тень прижимается до 0 1 2, масштаб 0,97; дуга accent-pressed.', selector: ':active · surface-3 · scale .97' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 ring с зазором 2; у кольца прогресса зазор 3, чтобы не слиться с дугой.', selector: ':focus-visible · outline 2 ring' },
  ],
  matrix: {
    rows: [
      { label: 'Иконка', props: { variant: 'icon' }, tokens: ['круг 44 · по умолчанию'] },
      { label: 'Иконка и текст', props: { variant: 'label' }, tokens: ['капсула h40 · статьи и справка'] },
      { label: 'С кольцом прогресса', props: { variant: 'progress' }, tokens: ['кольцо 2.5 = доля прочитанного'] },
    ],
    columns: ['rest', 'hover', 'pressed', 'focus'],
    rowsLabel: 'вариант',
    notes: [
      'круг 44 overlay · капсула h40 px 14/16 · телефон — круг 40, зона касания 44 · тень плавающая 0 8 20 −6 · aria-label="Наверх"',
      'порядок снизу вверх справа: Fab → «Наверх» → тосты (встают на 24 + 44 + 12) · кольцо = scrollTop / (scrollHeight − clientHeight)',
    ],
  },
  keyboard: [
    { keys: ['Tab'], action: 'Доходит до кнопки, только пока она видна: скрытая — inert' },
    { keys: ['Enter', 'Space'], action: 'Наверх; фокус переходит на первый заголовок страницы' },
    { keys: ['Home'], action: 'Тоже работает: браузер сам прокручивает страницу в начало' },
  ],
  a11y: [
    'Круг называется aria-label «Наверх», у капсулы имя — видимая подпись. Стрелка и кольцо — aria-hidden.',
    'После нажатия фокус переходит на первый h1 (ему ставится tabindex="-1", кольца нет): следующий Tab идёт от начала страницы, а не от кнопки внизу.',
    'Скрытая кнопка — inert и visibility: hidden: Tab и диктор её не находят, пока она не появилась.',
    'Кольцо — украшение: долю прочитанного диктор не читает, для действия она не нужна.',
    'При сниженном движении прокрутка мгновенная, появление — только прозрачностью.',
    'Ничего нажимаемого не перекрывает: тосты встают над кнопкой, на телефоне она встаёт над Fab, у подвала поднимается над ним.',
  ],
  motion: [
    {
      label: 'Появление',
      value: 'opacity + сдвиг 8 снизу + scale .9 → 1 · 200 мс · ease-out',
      easing: 'ease-out',
      reduced: 'только opacity',
      tokens: ['duration-base', 'shift-md', 'scale-enter'],
    },
    { label: 'Скрытие', value: 'то же обратно · 150 мс · ease-out', easing: 'ease-out', reduced: 'только opacity', tokens: ['duration-quick'] },
    {
      label: 'Прокрутка наверх',
      value: 'smooth браузера',
      note: 'Длительность выбирает браузер: в Chrome около 0,7 с, к 0,5 с до верха остаётся около 50 px.',
      reduced: 'мгновенно',
    },
    { label: 'Кольцо', value: 'без сглаживания', easing: 'instant', note: 'Идёт за пальцем: дуга пишется прямо из scrollTop.' },
    { label: 'Наведение и нажатие', value: 'фон и тень 75 мс · ease-hover, масштаб .97 · spring-micro', easing: 'ease-hover', tokens: ['duration-micro', 'spring-micro'] },
    { label: 'Тосты', value: 'встают над кнопкой · 200 мс · ease-out', easing: 'ease-out', tokens: ['duration-base'] },
  ],
  examples: [
    {
      id: 'article',
      title: 'Статья справки · кольцо прогресса',
      description: 'Прокрутите статью: кнопка появляется глубже двух экранов, прячется выше первого, у подвала поднимается над ним.',
    },
    { id: 'phone', title: 'Телефон · над Fab', description: 'Круг 40 по оси Fab, зазор 12; видна, только пока список тянут вверх.' },
  ],
};

export default meta;
