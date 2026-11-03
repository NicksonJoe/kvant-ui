import type { ReadyComponentMeta } from '../types';

const linkSignature = '{ label: string; href: string; external?: boolean; count?: number; status?: { tone: "success" | "warning" | "danger"; label: string } }';

const meta: ReadyComponentMeta = {
  id: 'site-footer',
  status: 'beta',
  title: 'Подвал сайта',
  description:
    'Пара к шапке сайта: та же колонка 1120 (на 1312 — поля 96), тот же логотип и те же ссылки 14/500 fg-2. Полный — на лендинге и в блоге: бренд с описанием и подпиской, до четырёх колонок ссылок, правовая строка с соцсетями и языком. Компактный — одна строка 64 в документации, на входе и в оплате. Ступени считаются по ширине самого подвала (container queries): уже 768 колонки сворачиваются в аккордеон, от 1184 бренд и колонки стоят в ряд, между ними бренд над колонками.',
  category: 'navigation',
  paperBoard: '1DQ9-0',
  anatomy: [
    'Полосы: линия separator сверху · сверху 64, снизу 32 · телефон — поля 20, сверху 40, снизу 36',
    'Бренд 352: логотип, описание 14/20 fg-2 до 32 знаков, подписка',
    'Колонки поровну, gap 32: заголовок 13/16 600 fg-1, ссылки 14/20 500 fg-2 с шагом 14, не больше 6',
    'Нижняя строка: линия separator и отступ 24 · © 13/16 fg-3 · соцсети — круги 32 ghost · язык справа',
    'Телефон: аккордеон — строка 52, заголовок 16/20 600, ссылки 16/24 в зоне 44, открыт один · соцсети 44 fill-1',
    'Компактный: одна строка 64 — знак и ©, ссылки-капсулы 32, соцсети',
  ],
  related: ['navigation-menu', 'back-to-top', 'accordion', 'link', 'layout'],
  source: { file: 'components/site-footer.tsx', exports: ['SiteFooter', 'SiteFooterSubscribe', 'SiteFooterLocale'] },
  dependencies: { npm: ['lucide-react'], registry: ['accordion', 'button', 'input', 'menu'] },
  props: [
    {
      name: 'variant',
      type: 'enum',
      options: ['full', 'compact'],
      default: 'full',
      description: 'full — лендинг и блог, поля как у шапки · compact — одна строка 64: документация, вход, оплата.',
    },
    { name: 'logo', type: 'node', required: true, control: false, description: 'Ссылка-логотип, как в шапке сайта: знак 24 и название 17/22 600. В компактном — только знак 20.' },
    { name: 'description', type: 'node', control: false, description: 'Одно предложение под логотипом (полный).' },
    { name: 'subscribe', type: 'node', control: false, description: 'Подписка под описанием (полный): <SiteFooterSubscribe />.' },
    {
      name: 'columns',
      type: 'object',
      signature: `readonly { title: string; links: readonly ${linkSignature}[] }[]`,
      control: false,
      description: 'Колонки ссылок (полный): до четырёх, в каждой не больше шести ссылок. Уже 768 — аккордеон.',
    },
    { name: 'links', type: 'object', signature: `readonly ${linkSignature}[]`, control: false, description: 'Несколько ссылок в строку (компактный).' },
    { name: 'legal', type: 'node', required: true, control: false, description: '«© 2026 Норда · Сделано в Санкт-Петербурге». В компактном стоит рядом со знаком.' },
    {
      name: 'social',
      type: 'object',
      signature: 'readonly { label: string; href: string; icon: ReactNode }[]',
      control: false,
      description: 'Соцсети: иконка 16 (на телефоне 18) или текстовый знак «VK»; label — имя для диктора.',
    },
    { name: 'locale', type: 'node', control: false, description: 'Переключатель языка справа в нижней строке: <SiteFooterLocale />.' },
    { name: 'className', type: 'string', control: false, description: 'Классы <footer>; остальные атрибуты footer тоже передаются.' },
  ],
  parts: [
    {
      name: 'SiteFooterSubscribe',
      description:
        'Письмо раз в месяц. Поле и кнопка md 36 в строку, на телефоне lg 44 стопкой. Пока адрес уходит — кнопка в состоянии загрузки. После отправки форма сменяется строкой «Проверьте почту» success-soft-fg, фокус переходит на неё. Ошибка оставляет форму и пишет «Не получилось подписаться. Попробуйте ещё раз.» (role="alert") на месте примечания.',
      props: [
        { name: 'title', type: 'node', required: true, description: '«Письмо раз в месяц: что нового в Норде» — 13/16 600 fg-1.' },
        { name: 'onSubscribe', type: 'function', signature: '(email: string) => void | Promise<void>', required: true, description: 'Отправить адрес; отклонённый промис показывает ошибку.' },
        { name: 'placeholder', type: 'string', default: 'Рабочая почта', description: 'Подсказка в поле и его имя для диктора.' },
        { name: 'action', type: 'string', default: 'Подписаться', description: 'Подпись кнопки.' },
        { name: 'note', type: 'node', description: 'Строка под полем 12/16 fg-3; на телефоне её нет.' },
        { name: 'done', type: 'node', default: 'Проверьте почту', description: 'Что встаёт на место формы после отправки.' },
      ],
    },
    {
      name: 'SiteFooterLocale',
      description: 'Язык: глобус 14, название 13/16 500 fg-2 и шеврон fg-3 в капсуле 32; на телефоне без глобуса, 14/20 в строке 44. Открывает меню с выбором (menuitemradio).',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Текущий язык.' },
        { name: 'options', type: 'object', signature: 'readonly { value: string; label: string }[]', required: true, description: 'Языки по названию на своём языке: «Русский», «English».' },
        { name: 'onValueChange', type: 'function', signature: '(value: string) => void', required: true, description: 'Выбран другой язык.' },
      ],
    },
  ],
  slots: [
    { name: 'site-footer', description: '<footer>: data-variant full | compact.' },
    { name: 'site-footer-columns', description: 'Колонки ссылок от 768.' },
    { name: 'site-footer-count', description: 'Счётчик после ссылки: 18, fill-2, 11/16 600.' },
    { name: 'site-footer-social', description: 'Ссылка соцсети: круг 32 ghost, на телефоне 44 fill-1.' },
    { name: 'site-footer-subscribe', description: 'Подписка: заголовок, поле и кнопка, примечание.' },
    { name: 'site-footer-subscribe-done', description: 'Строка «Проверьте почту» после отправки.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Ссылка 14/20 500 fg-2.' },
    { id: 'hover', label: 'наведение', description: 'fg-1 и подчёркивание 1 px цвета border с отступом 3.', selector: ':hover · fg-1 + линия' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 ring с зазором 2, радиус 4.', selector: ':focus-visible · кольцо r 4' },
    { id: 'expanded', label: 'раздел открыт', description: 'Телефон: колонка раскрыта, шеврон повёрнут на 180° и стал fg-2.', selector: 'data-open' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Логотип, подписка, ссылки колонок по порядку, соцсети, язык' },
    { keys: ['Enter', 'Space'], action: 'Телефон: открывают раздел аккордеона, другой раздел закрывается' },
    { keys: ['Enter'], action: 'В поле подписки — отправляет адрес' },
    { keys: ['↑', '↓'], action: 'В меню языка — между вариантами' },
  ],
  a11y: [
    '<footer> — ориентир contentinfo; ссылки внутри <nav aria-label="Подвал">.',
    'Колонка — список <ul> под заголовком <h2>. В аккордеоне на телефоне заголовок — кнопка внутри h3 (так устроен Accordion).',
    'Внешняя ссылка открывается в новой вкладке и говорит об этом: «(откроется в новой вкладке)»; стрелка ↗ — aria-hidden.',
    'Точка статуса — aria-hidden, смысл читается текстом из status.label: «Статус сервиса, всё работает».',
    'У соцсетей нет видимой подписи — имя в aria-label: «Норда в Telegram».',
    'Поле подписки называется по подсказке и описано примечанием (aria-describedby). После отправки фокус переходит на «Проверьте почту», ошибка — role="alert".',
  ],
  motion: [
    { label: 'Ссылки', value: 'цвет 75 мс · ease-hover', easing: 'ease-hover', tokens: ['duration-micro'] },
    { label: 'Аккордеон', value: 'высота 200 мс · ease-standard, шеврон поворот 180°', easing: 'ease-standard', tokens: ['duration-base'] },
    { label: 'Появление при прокрутке', value: 'нет', note: 'Подвал — обычный блок в конце страницы.' },
  ],
  examples: [
    {
      id: 'full',
      title: 'Полный · лендинг, блог',
      description: 'В натуральную ширину 1312: бренд, подписка, четыре колонки, соцсети и язык. Окно уже — рамка прокручивается вбок.',
    },
    { id: 'phone', title: 'Телефон · 375', description: 'Тот же подвал шириной 375: колонки свёрнуты в аккордеон, открыт один раздел, соцсети 44 на fill-1.' },
    { id: 'compact', title: 'Компактный · документация, вход, оплата', description: 'Одна строка 64: знак и ©, ссылки-капсулы, соцсети.' },
  ],
};

export default meta;
