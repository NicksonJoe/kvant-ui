import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'visually-hidden',
  status: 'beta',
  title: 'Скрытый текст и объявления',
  description:
    'То, что слышит экранный диктор, но не видно на экране: имя у кнопки-иконки, полная сумма вместо «1,3 млн», объявления «Сохранено» и «Не удалось сохранить». VisuallyHidden прячет текст только от глаз, SkipLink — первая остановка Tab на странице, Announce — живой регион для того, что произошло без переноса фокуса. На экране ничего не меняется.',
  category: 'utilities',
  paperBoard: '1GJ-0',
  anatomy: [
    'Скрытый текст: 1×1 px, clip, без display: none и visibility: hidden',
    'Ссылка «Перейти к содержимому»: при фокусе капсула 36 fg-1, слева сверху 16 от края',
    'Живой регион: в DOM с монтирования, пустой, меняется только текст',
    'polite — role="status", assertive — role="alert"',
  ],
  related: ['button', 'toast', 'alert', 'copy-button', 'virtualizer', 'focus-management'],
  source: { file: 'components/visually-hidden.tsx', exports: ['VisuallyHidden', 'SkipLink', 'Announce'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['portal'] },
  props: [
    { name: 'children', type: 'string', required: true, description: 'Что слышит диктор: «Изменить сделку «Айдентика»», «Выручка за ноябрь: 1 312 400 рублей».' },
    { name: 'render', type: 'node', signature: 'ReactElement', control: false, description: 'Другой тег вместо span: скрытый заголовок раздела — render={<h2 />}.' },
    { name: 'className', type: 'string', control: false, description: 'Классы поверх sr-only; focus:not-sr-only показывает текст при фокусе.' },
  ],
  parts: [
    {
      name: 'SkipLink',
      description:
        'Первая ссылка в <body>. Скрыта, пока не получит фокус; с фокусом — капсула 36 fg-1 с текстом surface-1 и кольцом ring, слева сверху 16 от края, над липкой шапкой (слой dropdown). Enter переводит фокус на главное содержимое мимо меню: цели без tabindex ставится tabindex="-1", кольца на ней нет.',
      props: [
        { name: 'href', type: 'string', default: '#main', description: 'Якорь главного содержимого: <main id="main">.' },
        { name: 'children', type: 'node', default: 'Перейти к содержимому', description: 'Подпись ссылки.' },
      ],
    },
    {
      name: 'Announce',
      description:
        'Живой регион sr-only. Монтируется пустым: текст, пришедший вместе с регионом, записывается через 100 мс, иначе диктор его пропустит. Дальше меняется только текст; тот же текст чаще раза в 2 с не повторяется. Повторить то же сообщение (вторая страница «Загружено 20 клиентов») — очистить регион пустой строкой и записать снова. Фокус никуда не переносит.',
      props: [
        {
          name: 'politeness',
          type: 'enum',
          options: ['polite', 'assertive'],
          default: 'polite',
          description: 'polite — role="status", ждёт паузы: «Сохранено», «Загружено 20 клиентов». assertive — role="alert", перебивает сразу: только ошибки, которые теряют данные.',
        },
        { name: 'children', type: 'string', default: '', description: 'Текст объявления; пустая строка очищает регион.' },
      ],
    },
  ],
  slots: [
    { name: 'visually-hidden', description: 'Скрытый текст: sr-only.' },
    { name: 'skip-link', description: 'Ссылка «Перейти к содержимому»; видна только с фокусом.' },
    { name: 'announce', description: 'Живой регион: role="status" или role="alert", aria-live, aria-atomic.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Текст и регион не видны; ссылка «Перейти к содержимому» скрыта.' },
    { id: 'focus', label: 'фокус с клавиатуры', description: 'Ссылка появляется капсулой 36 слева сверху, кольцо ring.', selector: ':focus · капсула fg-1' },
    { id: 'empty', label: 'регион пуст', description: 'Announce до первого объявления и после очистки пустой строкой.' },
    { id: 'filled', label: 'объявлено', description: 'Текст в регионе: диктор прочитал его по правилам politeness.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Первая остановка на странице — «Перейти к содержимому»' },
    { keys: ['Enter'], action: 'Фокус на главное содержимое; следующий Tab идёт уже от него' },
  ],
  a11y: [
    'Скрытый текст — 1×1 px и clip, без display: none и visibility: hidden: диктор его читает, клики и выделение мышью он не ловит.',
    'Кнопке-иконке хватает aria-label (IconButton его требует); VisuallyHidden нужен, когда имя складывается из частей или видимый текст короче смысла: «1,3 млн ₽ ↑ 8 %» → «Выручка за ноябрь: 1 312 400 рублей, рост на 8 процентов к октябрю», а видимую часть закройте aria-hidden.',
    'Живой регион монтируется пустым до первого объявления: регион, вставленный уже с текстом, многие дикторы не читают. Поэтому Announce держите на странице постоянно, а меняйте только текст.',
    'polite ждёт паузы, assertive перебивает — только ошибки, которые теряют данные. Одно и то же не повторяется чаще раза в 2 с: автосохранение и догрузка не тараторят.',
    'Фокус никуда не переносится: объявление говорит, что произошло, а пользователь остаётся там, где был.',
    'Видимая подпись «Сохранено» и регион — разные элементы: видимую не делайте живой, иначе диктор прочитает дважды.',
  ],
  motion: [
    { label: 'Скрытый текст и объявления', value: 'нет', note: 'Скрытый текст не виден, объявления звучат.' },
    {
      label: 'Видимая подпись «Сохранено»',
      value: 'opacity · 150 мс · ease-out',
      easing: 'ease-out',
      reduced: 'так же: это смена прозрачности, не движение',
      tokens: ['duration-quick'],
    },
    { label: 'Ссылка «Перейти к содержимому»', value: 'появляется сразу, 0 мс', easing: 'instant', note: 'Клавиатура не ждёт анимацию.' },
  ],
  examples: [
    { id: 'hidden-text', title: 'Скрытый текст · видно одно, диктор слышит больше', description: 'Кнопки-иконки в строке сделки, сокращённая сумма в KPI, ссылка «Перейти к содержимому».' },
    { id: 'announcements', title: 'Живые объявления · что произошло, без переноса фокуса', description: 'Автосохранение — polite, ошибка сети — assertive, догрузка страницы — без повтора чаще 2 с.' },
    { id: 'skip-link', title: 'Перейти к содержимому', description: 'Нажмите Tab в начале примера: ссылка появится слева сверху окна, Enter уведёт фокус мимо меню.' },
  ],
};

export default meta;
