import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'timer',
  status: 'beta',
  title: 'Таймер',
  description:
    'Обратный отсчёт до срока и учёт времени по задаче. Цифры табличные: у каждой одна ширина, поэтому строка не дрожит каждую секунду. Крупный вид — 48/52 с подписями «часа · минут · секунд» в нужном числе, капсула h24 — в строку таблицы и в карточку: меньше 15 минут становится warning-soft, просрочка — danger-soft с «−». Время считается от часов, а не по тикам, поэтому фоновая вкладка его не теряет.',
  category: 'data-display',
  paperBoard: '1GJ-0',
  anatomy: [
    'Цифры Inter 48/52 500 tabular',
    'Двоеточие fg-4, не мигает',
    'Подписи 12/16 fg-3: «часа», «минут», «секунд»',
    'Десятые секундомера fg-3',
    'Капсула h24 12/16 500 со значком',
    'Круги: строки 36, самый долгий и самый быстрый',
  ],
  related: ['progress', 'animated-number', 'relative-time', 'badge'],
  source: {
    file: 'components/timer.tsx',
    exports: ['Timer', 'TimerLaps', 'TimerRecording', 'useCountdown', 'useStopwatch', 'TIMER_MODES', 'TIMER_VARIANTS'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['visually-hidden'] },
  props: [
    {
      name: 'value',
      type: 'number',
      options: [8_077_000, 725_000, -221_000, 2_838_600],
      required: true,
      description: 'Миллисекунды: сколько осталось до срока (меньше нуля — просрочено) или сколько прошло на секундомере. Берите из useCountdown(deadline) и useStopwatch().',
    },
    { name: 'mode', type: 'enum', options: ['countdown', 'stopwatch'], default: 'countdown', description: 'countdown округляет вверх до секунды — ноль появляется ровно в срок; stopwatch — вниз до десятых.' },
    { name: 'variant', type: 'enum', options: ['display', 'inline'], default: 'display', description: 'display — цифры 48/52 с подписями единиц; inline — капсула h24 для строки таблицы и карточки.' },
    { name: 'tenths', type: 'boolean', default: false, description: 'Секундомер в display: десятые после запятой, fg-3.' },
    { name: 'paused', type: 'boolean', default: false, description: 'Секундомер стоит: капсула fill-2 со значком паузы и цифрами fg-2, диктор добавляет «на паузе».' },
    { name: 'warnBelow', type: 'number', options: [300_000, 900_000], default: 900_000, description: 'Капсула обратного отсчёта становится warning-soft, когда осталось меньше, мс. По умолчанию 15 минут.' },
    { name: 'aria-label', type: 'string', description: 'Что отсчитывается: «До ответа клиенту».' },
    { name: 'className', type: 'string', control: false, description: 'Корень role="timer".' },
  ],
  parts: [
    {
      name: 'TimerLaps',
      description: 'Круги секундомера: текущий сверху, затем законченные от новых к старым. С двух законченных кругов самый долгий — danger-soft-fg, самый быстрый — success-soft-fg.',
      props: [
        { name: 'laps', type: 'object', signature: 'readonly number[]', required: true, description: 'Законченные круги, от первого к последнему, мс.' },
        { name: 'current', type: 'number', description: 'Идущий круг, мс; строка без отметки, fg-1.' },
      ],
    },
    {
      name: 'TimerRecording',
      description: '«Идёт запись»: точка success с кольцом success-soft 3, кольцо дышит раз в 2 с; caption 500 success-soft-fg.',
      props: [{ name: 'children', type: 'node', required: true, description: 'Подпись: «Идёт запись».' }],
    },
    {
      name: 'useCountdown',
      description: '(deadline: Date | number) → мс до срока, меньше нуля после него. Перерисовывает ровно на смене показанной секунды, а не через секунду после монтирования.',
      props: [{ name: 'deadline', type: 'object', signature: 'Date | number', required: true, description: 'Срок: Date или миллисекунды эпохи.' }],
    },
    {
      name: 'useStopwatch',
      description: '({ initial, laps, autoStart, interval }) → { elapsed, running, laps, lapElapsed, start, pause, toggle, lap, reset }. Время берётся из Date.now(), поэтому фоновая вкладка и сон ноутбука его не теряют.',
      props: [
        { name: 'initial', type: 'number', default: 0, description: 'С какого значения продолжить, мс: уже записанное на сервере время.' },
        { name: 'laps', type: 'object', signature: 'readonly number[]', description: 'Уже законченные круги; их сумма входит в initial.' },
        { name: 'autoStart', type: 'boolean', default: false, description: 'Запустить сразу.' },
        { name: 'interval', type: 'number', default: 100, description: 'Шаг перерисовки, мс: 100 для десятых, 1000 для целых секунд.' },
      ],
    },
  ],
  slots: [
    { name: 'timer', description: 'Корень role="timer"; у капсулы data-tone: neutral, warning, danger, accent, paused.' },
    { name: 'timer-value', description: 'Видимые цифры, aria-hidden: диктор читает фразу «2 часа 14 минут 37 секунд».' },
    { name: 'timer-digits', description: 'Группа цифр 48/52 500 tabular.' },
    { name: 'timer-separator', description: 'Двоеточие fg-4.' },
    { name: 'timer-unit', description: 'Подпись единицы 12/16 500 fg-3 в нужном числе.' },
    { name: 'timer-tenths', description: 'Десятые секундомера «,6» fg-3.' },
    { name: 'timer-sign', description: '«−» просроченного отсчёта.' },
    { name: 'timer-dot', description: 'Точка accent в капсуле идущего секундомера.' },
    { name: 'timer-laps', description: 'Список кругов.' },
    { name: 'timer-lap', description: 'Строка круга 36 с линией сверху; data-mark: slowest, fastest.' },
    { name: 'timer-recording', description: 'Индикатор «Идёт запись».' },
  ],
  states: [
    { id: 'rest', label: 'отсчёт', description: 'Капсула fill-2, часы fg-2, цифры fg-1.', props: { variant: 'inline' } },
    { id: 'highlighted', label: 'меньше 15 минут', description: 'Капсула warning-soft.', props: { variant: 'inline', value: 725_000 } },
    { id: 'invalid', label: 'просрочено', description: 'Капсула danger-soft, треугольник и «−00:03:41».', props: { variant: 'inline', value: -221_000 } },
    { id: 'selected', label: 'секундомер идёт', description: 'Капсула accent-soft с точкой accent.', props: { variant: 'inline', mode: 'stopwatch', value: 2_838_600 } },
    { id: 'disabled', label: 'на паузе', description: 'Капсула fill-2, пауза fg-3, цифры fg-2.', props: { variant: 'inline', mode: 'stopwatch', paused: true, value: 2_838_600 } },
  ],
  keyboard: [],
  a11y: [
    'role="timer" не зачитывается на каждом тике (aria-live у него off): диктор слышит значение, когда сам доходит до таймера. Имя — aria-label: «До ответа клиенту».',
    'Видимые цифры aria-hidden, вместо них фраза с единицами в нужном числе: «2 часа 14 минут 37 секунд», «просрочено на 3 минуты 41 секунду», у секундомера на паузе — «, на паузе».',
    'Тон капсулы не единственный признак: просрочка — ещё треугольник и «−», пауза — значок паузы.',
    'Если о сроке надо предупредить, объявите это один раз через Announce, а не делайте таймер живым регионом.',
  ],
  motion: [
    { label: 'Цифры', value: 'без анимации', note: 'Меняются на месте; табличные цифры держат ширину, двоеточие не мигает.' },
    { label: 'Смена тона капсулы', value: 'фон и цвет · 150 мс · ease-hover', easing: 'ease-hover', reduced: 'так же: это смена цвета', tokens: ['duration-quick'] },
    { label: 'Прогресс срока', value: 'ширина · 300 мс · ease-standard', note: 'Progress под отсчётом.', easing: 'ease-standard', tokens: ['duration-slow'] },
    { label: 'Точка записи', value: 'кольцо 3 → 5 px · 2000 мс · ease-in-out · по кругу', easing: 'ease-in-out', reduced: 'неподвижное кольцо 3 px' },
  ],
  examples: [
    { id: 'sla', title: 'Обратный отсчёт до срока', description: 'SLA 4 часа: крупные цифры, прогресс прошедшего времени, срок и ответственная.' },
    { id: 'stopwatch', title: 'Учёт времени с кругами', description: 'Секундомер с десятыми, «Пауза» и «Круг», самый долгий и самый быстрый круг.' },
    { id: 'inline', title: 'Капсулы в строке', description: 'Обычная, меньше 15 минут, просрочено, идёт, на паузе.' },
  ],
};

export default meta;
