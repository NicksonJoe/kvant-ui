import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'questionnaire',
  status: 'beta',
  title: 'Опросник',
  description:
    'Уточняющие вопросы агента. Когда данных не хватает, агент спрашивает вариантами, а не просит написать абзац. Один вопрос на экране; отвеченные сворачиваются в строку и остаются редактируемыми — «Изменить» возвращает к вопросу. Варианты — чипы h32: один ответ или несколько, «Свой вариант» открывает поле. Обязательный вопрос без ответа не пропускает дальше и говорит почему.',
  category: 'chat-ai',
  paperBoard: '70H-0',
  anatomy: [
    'Карточка: r16, surface-1, поля 24 (сверху 20), части через 20',
    'Шапка: лицо агента 32, заголовок 14/20 600, «2 из 3» caption tnum и полоски 16×4 через 3',
    'Отвеченный вопрос: строка h40 r12 fill-1, галочка success 16, «Тон письма: Дружелюбный», «Изменить» h28',
    'Вопрос 16/24 600 и подсказка 13/18 fg-3',
    'Чипы h32, px12, 13/16 500, control-raised, через 8 с переносом строк',
    'Выбранный чип: accent-soft, кольцо accent 35 %, галочка 14',
    '«Свой вариант»: пунктир input, по нажатию — поле той же формы',
    'Подвал: «Выбрано 2 · ответы можно поменять до отправки», «Пропустить» ghost sm, «Продолжить» primary sm',
  ],
  related: ['conversation', 'trace', 'choice-card', 'toggle-group', 'steps'],
  source: { file: 'components/questionnaire.tsx', exports: ['Questionnaire', 'questionnaireStep', 'initialQuestionnaire'] },
  dependencies: { npm: ['lucide-react'], registry: ['button', 'conversation', 'focus-management', 'visually-hidden'] },
  props: [
    { name: 'title', type: 'node', required: true, description: 'Зачем агент спрашивает: «Пара уточнений, чтобы письмо попало в точку».' },
    {
      name: 'questions',
      type: 'object',
      required: true,
      control: false,
      signature: 'readonly Question[]',
      description: 'Вопросы по порядку: id, title, label (короткое имя для строки ответа), hint, multiple, required, custom, options { value, label, disabled }.',
    },
    { name: 'defaultAnswers', type: 'object', signature: 'Record<string, readonly string[]>', control: false, description: 'Известные ответы: эти вопросы сразу свёрнуты, открыт первый без ответа.' },
    {
      name: 'onComplete',
      type: 'function',
      required: true,
      signature: '(answers: QuestionnaireAnswers) => void',
      control: false,
      description: 'После последнего вопроса — и снова после каждого изменённого ответа. Ответы — значения вариантов; свой вариант приходит своим текстом, пропущенный вопрос — пустым списком.',
    },
    { name: 'footnote', type: 'string', default: 'ответы можно поменять до отправки', description: 'Подвал после «Выбрано N».' },
  ],
  parts: [
    {
      name: 'Question',
      description: 'Вопрос для questions.',
      props: [
        { name: 'id', type: 'string', required: true, description: 'Ключ ответа.' },
        { name: 'title', type: 'string', required: true, description: 'Сам вопрос: «Что упомянуть в письме?».' },
        { name: 'label', type: 'string', description: 'Для свёрнутой строки: «Тон письма: Дружелюбный» (по умолчанию — вопрос).' },
        { name: 'hint', type: 'string', description: 'Под вопросом: «Можно выбрать несколько».' },
        { name: 'multiple', type: 'boolean', description: 'Несколько ответов: чипы — checkbox; иначе один — radio.' },
        { name: 'required', type: 'boolean', description: 'Без ответа дальше нельзя, «Пропустить» нет.' },
        { name: 'custom', type: 'boolean', description: 'Чип «Свой вариант».' },
        { name: 'options', type: 'object', required: true, signature: 'readonly QuestionOption[]', description: 'value, label, disabled.' },
      ],
    },
    {
      name: 'questionnaireStep · initialQuestionnaire',
      description:
        'Чистая логика переходов: toggle, add (свой вариант), next, skip, edit. next без ответа на обязательный — ошибка «Выберите вариант»; пустой свой вариант — «Напишите вариант»; повтор существующего варианта выбирает его. После next открывается следующий вопрос без ответа, а когда отвечены все — итог.',
      props: [],
    },
  ],
  slots: [
    { name: 'questionnaire', description: 'Карточка; data-complete, когда отвечено всё.' },
    { name: 'questionnaire-progress', description: 'Полоски 16×4: accent до текущего вопроса, fill-3 дальше; data-done.' },
    { name: 'questionnaire-answer', description: 'Свёрнутый ответ с «Изменить».' },
    { name: 'questionnaire-question', description: 'Открытый вопрос: заголовок, подсказка, чипы, ошибка.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Чип control-raised: surface-1 и кольцо border.' },
    { id: 'hover', label: 'наведение', description: 'Фон surface-2 за 75 мс.' },
    { id: 'pressed', label: 'нажатие', description: 'surface-3, только кольцо, scale .97.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 ring с зазором 2.' },
    { id: 'selected', label: 'выбрано', description: 'accent-soft, кольцо accent 35 %, галочка рисуется 150 мс.', selector: 'aria-checked' },
    { id: 'disabled', label: 'отключено', description: 'Вариант недоступен: 50 %, стрелки его пропускают.', selector: 'aria-disabled' },
    { id: 'invalid', label: 'нет ответа', description: 'Обязательный вопрос без ответа: под чипами «Выберите вариант» danger-soft-fg, aria-invalid, фокус на первый чип.', selector: 'aria-invalid' },
    { id: 'filled', label: 'отвечено', description: 'Вопросы свёрнуты в строки, подвала нет.', selector: 'data-complete' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Группа чипов вместе со «Свой вариант» — одна остановка, затем «Пропустить», «Продолжить»; у свёрнутых строк — «Изменить»' },
    { keys: ['←', '→', '↑', '↓'], action: 'Между чипами; в вопросе с одним ответом стрелка сразу выбирает' },
    { keys: ['Home', 'End'], action: 'Первый чип и «Свой вариант» (или последний чип)' },
    { keys: ['Space', 'Enter'], action: 'Выбрать или снять вариант' },
    { keys: ['Enter'], action: 'В поле своего варианта — добавить и выбрать' },
    { keys: ['Esc'], action: 'Закрыть поле своего варианта (панель вокруг не закрывается)' },
  ],
  a11y: [
    'Один ответ — role="radiogroup" с role="radio", несколько — role="group" с role="checkbox"; у группы имя — вопрос, описание — подсказка и ошибка.',
    'Выбранность — aria-checked, не только цвет: у выбранного есть галочка.',
    'Отключённый вариант — aria-disabled: его видно и слышно, но выбрать нельзя.',
    'Ошибка обязательного вопроса связана с группой через aria-describedby, у группы aria-invalid, фокус уходит на первый чип.',
    'После «Продолжить» фокус переходит на заголовок следующего вопроса, после «Изменить» — на выбранный чип, после последнего — на карточку.',
    '«Изменить» назван полностью: «Изменить: Тон письма».',
    'Прогресс читается словами «Вопрос 2 из 3»; полоски aria-hidden.',
  ],
  motion: [
    { label: 'Выбор', value: 'фон · 75 мс · ease-hover', easing: 'ease-hover', tokens: ['duration-micro'] },
    { label: 'Галочка', value: 'отрисовка · 150 мс · ease-out', easing: 'ease-out', tokens: ['duration-quick'] },
    { label: 'Нажатие', value: 'scale .97', easing: 'spring-0', reduced: 'без сжатия', tokens: ['scale-press'] },
    { label: 'Следующий вопрос', value: 'x 16 + opacity · 200 мс · ease-out', easing: 'ease-out', reduced: 'только opacity', tokens: ['duration-base', 'shift-lg'] },
    { label: 'Ответ сворачивается', value: 'строка проявляется · 200 мс · ease-standard', easing: 'ease-standard', tokens: ['duration-base'] },
  ],
  examples: [
    { id: 'email', title: 'Уточнения к письму', description: 'Тон (обязательный, один ответ), что упомянуть (несколько и свой вариант), подпись; итог уходит агенту.' },
    { id: 'report', title: 'В разговоре с агентом', description: 'Агент уточняет отчёт прямо в ленте и, получив ответы, пишет его потоком.' },
  ],
};

export default meta;
