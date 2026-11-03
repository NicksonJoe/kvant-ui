import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'theme-provider',
  status: 'beta',
  title: 'Тема и окружение',
  description:
    'Тема, режим, шрифт, форма, плотность и сниженное движение живут атрибутами data-* на <html>, язык — в lang. Компоненты читают только var(--color-…), поэтому смена атрибута перекрашивает интерфейс без правки разметки; без атрибутов действует cobalt в светлом режиме. themeScript ставит сохранённый выбор до первой отрисовки, ThemeProvider даёт приложению одно общее состояние, useTheme читает и меняет его.',
  category: 'utilities',
  paperBoard: '9-0',
  anatomy: [
    'data-accent — восемь тем, по умолчанию cobalt',
    'data-mode — light или dark, независим от темы; system следует за ОС',
    'data-font, data-shape, data-density, data-reduce-motion',
    'lang — язык интерфейса',
    'themeScript — первым в <head>, до первой отрисовки',
    'ThemeProvider — одно состояние на приложение',
    'useTheme — [тема, setTheme(patch)]',
    'Сохранение в localStorage «kvant-theme»',
  ],
  related: ['portal', 'presence', 'focus-management'],
  source: { file: 'components/theme-provider.tsx', exports: ['ThemeProvider', 'themeScript'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'lang', type: 'enum', options: ['ru', 'en', 'kk'], default: 'ru', description: 'Язык интерфейса на <html lang>: переносы, голос диктора, даты и числа. При размонтировании возвращается прежний.' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Приложение: каждый useTheme внутри читает и меняет одно состояние.' },
  ],
  parts: [
    {
      name: 'useTheme',
      description:
        'Хук из theme.ts: возвращает [theme, setTheme]. setTheme({ accent: \'jade\', mode: \'dark\' }) дописывает выбор, ставит атрибуты на <html> и сохраняет в localStorage. Режим system следует за настройкой ОС на лету. Внутри ThemeProvider все вызовы делят одно состояние, без него у каждого вызова своё.',
      props: [
        { name: 'accent', type: 'enum', options: ['graphite', 'cobalt', 'iris', 'aqua', 'jade', 'amber', 'ember', 'orchid'], default: 'cobalt', description: 'Тема: data-accent.' },
        { name: 'mode', type: 'enum', options: ['light', 'dark', 'system'], default: 'light', description: 'Режим: data-mode; system превращается в light или dark по ОС.' },
        { name: 'font', type: 'enum', options: ['inter', 'geist'], default: 'inter', description: 'Шрифт: data-font.' },
        { name: 'shape', type: 'enum', options: ['capsule', 'density'], default: 'capsule', description: 'Форма контролов: капсулы или скругление 6–10, data-shape.' },
        { name: 'density', type: 'enum', options: ['regular', 'compact'], default: 'regular', description: 'Плотность: compact опускает контролы на ступень (36 → 32) и строки таблиц 48 → 40, data-density.' },
        { name: 'reduceMotion', type: 'boolean', default: false, description: 'Сниженное движение поверх настройки ОС: data-reduce-motion.' },
      ],
    },
    {
      name: 'themeScript',
      description:
        'Строка со скриптом: вставьте её первой в <head> — в index.html или через dangerouslySetInnerHTML при серверной отрисовке. Читает тот же «kvant-theme», пропускает неизвестные значения и сломанное хранилище, system решает по ОС. Без него тёмная тема на миг вспыхивает светлой.',
      props: [],
    },
  ],
  slots: [],
  // ThemeProvider renders no element of its own: the specimen is the live readout of <html>.
  anatomyMap: {
    parts: [
      { name: 'lang', selector: 'dl > div:nth-child(1)', description: 'Язык интерфейса из свойства lang.' },
      { name: 'data-accent', selector: 'dl > div:nth-child(2)', description: 'Тема: восемь акцентов, по умолчанию cobalt.' },
      { name: 'data-mode', selector: 'dl > div:nth-child(3)', description: 'light или dark; выбор system решается по ОС.' },
      { name: 'data-font', selector: 'dl > div:nth-child(4)', description: 'Inter или Geist.' },
      { name: 'data-shape', selector: 'dl > div:nth-child(5)', description: 'Капсулы или скругление контролов.' },
      { name: 'data-density', selector: 'dl > div:nth-child(6)', description: 'Обычная или плотная.' },
    ],
  },
  states: [
    { id: 'rest', label: 'по умолчанию', description: 'Ничего не сохранено: cobalt, светлый режим, Inter, капсулы, обычная плотность.' },
    { id: 'filled', label: 'сохранённый выбор', description: 'themeScript ставит его на <html> до первой отрисовки, ThemeProvider подхватывает тот же выбор.' },
  ],
  keyboard: [],
  a11y: [
    'lang на <html> выбирает голос экранного диктора, правила переносов (.prose { hyphens: auto }) и формат дат и чисел.',
    'Режим system следует за prefers-color-scheme и меняется вместе с ОС, без перезагрузки.',
    'Сниженное движение из настроек продукта (reduceMotion) действует вместе с prefers-reduced-motion: любой из двух его включает.',
    'Атрибуты стоят на <html> до первой отрисовки — без вспышки светлой темы у тех, кто выбрал тёмную.',
  ],
  motion: [
    {
      label: 'Смена темы',
      value: 'только цвета · 200 мс',
      detail: 'color, background-color, border-color, outline, fill, stroke; на время смены — атрибут data-theme-transition',
      easing: 'ease-standard',
      reduced: '150 мс, только цвета',
      tokens: ['duration-base'],
      note: 'Тени и раскладка меняются сразу.',
    },
    { label: 'Первая отрисовка', value: 'без анимации', easing: 'instant', note: 'Сохранённая тема стоит с первого кадра.' },
  ],
  examples: [
    { id: 'settings', title: 'Настройки оформления', description: 'Тема, режим, плотность и форма через useTheme: меняется весь сайт, и шапка остаётся в том же состоянии.' },
    { id: 'setup', title: 'Подключение', description: 'themeScript в <head>, ThemeProvider вокруг приложения, вариант для серверной отрисовки.' },
  ],
};

export default meta;
