import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'signature-pad',
  status: 'beta',
  title: 'Подпись',
  description:
    'Акт приёмки, доверенность, подтверждение доставки — клиент расписывается пальцем на телефоне курьера, пером или мышью. Поле выглядит как лист: светлое и в тёмной теме, с пунктирной линией и крестиком, чернила fg-1. Толщина линии идёт за нажимом пера (у пальца и мыши — за скоростью), штрихи сглажены кривыми. Подпись не уходит, пока её не приняли кнопкой; принятая становится картинкой с именем и временем. С клавиатуры Enter открывает ввод имени — подпись набирается шрифтом.',
  category: 'pickers',
  paperBoard: '1DPQ-0',
  anatomy: [
    'Подпись поля 13/16 500 fg-2 и пометка справа caption fg-3',
    'Лист surface-1, рамка input, радиус 20, высота 200 (телефон — 160, во всю ширину)',
    'Линия 1,5 dashed border на 40 от низа, крестик fg-4',
    'Подсказка: перо 20 fg-4 и «Распишитесь пальцем или мышью» fg-3; гаснет на первом касании',
    'Чернила fg-1, 2–3,5 px',
    'Под полем: отмена штриха (ghost 32) · «Очистить» · кто подписывает · «Принять подпись» accent',
    'Принятая: картинка на surface-2 · галочка success · имя и время · ⋯',
  ],
  related: ['file-upload', 'toast', 'menu', 'alert-dialog'],
  source: {
    file: 'components/signature-pad.tsx',
    exports: [
      'SignaturePad',
      'SignatureCard',
      'signatureToSvg',
      'signatureToDataUrl',
      'signatureStrokeWidth',
      'smoothStroke',
      'signatureLength',
      'isSignatureTooShort',
    ],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button', 'visually-hidden'] },
  props: [
    { name: 'label', type: 'string', default: 'Подпись', description: 'Подпись над полем и имя для диктора: «Подпись получателя, пусто».' },
    { name: 'meta', type: 'string', description: 'Справа от подписи, fg-3: «Акт № 1184 от 2 ноября».' },
    { name: 'signer', type: 'string', description: 'Кто подписывает — перед кнопкой принятия, когда есть подпись.' },
    { name: 'hint', type: 'string', default: 'Распишитесь пальцем или мышью', description: 'Подсказка на пустом листе.' },
    { name: 'acceptLabel', type: 'string', default: 'Принять подпись', control: false, description: 'Текст кнопки принятия.' },
    { name: 'description', type: 'string', description: 'Под полем: причина, почему оно отключено, или пояснение.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Лист surface-2 с прозрачностью 50 %, без кнопок, не рисует.' },
    { name: 'minLength', type: 'number', default: 40, control: false, description: 'Короче этого (px всех штрихов) — «Похоже на случайный штрих».' },
    { name: 'minStrokes', type: 'number', default: 2, control: false, description: 'Меньше штрихов — тоже ошибка, как в макете. Для росчерка одной линией поставьте 1.' },
    { name: 'onAccept', type: 'function', signature: '(data: SignatureData) => void', control: false, description: '«Принять подпись» с годной подписью: штрихи или набранное имя, размер листа, цвет чернил. Картинка — signatureToDataUrl / signatureToSvg.' },
    { name: 'onClear', type: 'function', signature: '(restore: () => void) => void', control: false, description: '«Очистить» стирает сразу, без подтверждения; restore вернёт подпись — для плашки «Подпись очищена · Отменить».' },
    { name: 'className', type: 'string', control: false, description: 'Класс корня.' },
  ],
  parts: [
    {
      name: 'SignatureCard',
      description: 'Принятая подпись: картинка, галочка, кто и когда, меню ⋯. Появляется кроссфейдом 200 мс.',
      props: [
        { name: 'src', type: 'string', required: true, description: 'Картинка: signatureToDataUrl(data, { trim: true }).' },
        { name: 'name', type: 'string', required: true, description: 'Кто подписал; alt картинки — «Подпись: <имя>».' },
        { name: 'time', type: 'node', required: true, description: 'Когда: «2 ноября 2026, 14:32», tabular.' },
        { name: 'actions', type: 'node', description: 'Меню ⋯: «Скачать PNG», «Подписать заново», «Ещё» → «В архив…», «Удалить…».' },
      ],
    },
    {
      name: 'signatureToDataUrl',
      description: 'PNG с прозрачным фоном через canvas, чернила цвета листа.',
      props: [
        { name: 'scale', type: 'number', default: 2, description: 'Плотность пикселей.' },
        { name: 'trim', type: 'boolean', default: false, description: 'Обрезать по чернилам с полем 8 px.' },
      ],
    },
    {
      name: 'signatureToSvg',
      description: 'Вектор для PDF: путь на каждый кусок кривой со своей толщиной, фон прозрачный.',
      props: [{ name: 'trim', type: 'boolean', default: false, description: 'Обрезать по чернилам с полем 8 px.' }],
    },
  ],
  slots: [
    { name: 'signature-pad', description: 'Корень: подпись поля, лист, ошибка или пояснение, кнопки.' },
    { name: 'signature-pad-surface', description: 'Лист, data-mode="light"; data-state — empty или signed, data-drawing во время штриха, aria-invalid при ошибке.' },
    { name: 'signature-pad-hint', description: 'Подсказка на линии; data-hidden с первого касания.' },
    { name: 'signature-pad-typed', description: 'Набранное имя курсивом 32 на линии.' },
    { name: 'signature-pad-error', description: '«Похоже на случайный штрих», danger-soft-fg с крестиком в круге.' },
    { name: 'signature-pad-actions', description: 'Отмена штриха, «Очистить», кто подписывает, «Принять подпись».' },
    { name: 'signature-card', description: 'Принятая подпись.' },
    { name: 'signature-card-image', description: 'Картинка на светлом листе surface-2, data-mode="light" и в тёмной теме.' },
  ],
  states: [
    { id: 'empty', label: 'пусто', description: 'Подсказка на линии, кнопки неактивны.' },
    { id: 'rest', label: 'покой', description: 'Рамка input.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3, курсор-перо.' },
    { id: 'pressed', label: 'рисование', description: 'Рамка ring 2 (border + кольцо 1), подсказка скрыта.', selector: 'data-drawing' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 с отступом 2; Enter — ввести имя.' },
    { id: 'filled', label: 'с подписью', description: 'Чернила fg-1, отмена штриха и «Очистить» активны, справа — кто подписывает.' },
    { id: 'invalid', label: 'ошибка', description: 'Короче 40 px или меньше 2 штрихов: рамка danger и «Похоже на случайный штрих». Следующий штрих снимает ошибку.' },
    { id: 'disabled', label: 'отключено', description: 'surface-2, прозрачность 50 %, причина под полем.', props: { disabled: true } },
  ],
  keyboard: [
    { keys: ['Enter'], action: 'На листе — ввести имя: подпись набирается шрифтом' },
    { keys: ['Enter'], action: 'В поле имени — поставить подпись' },
    { keys: ['Esc'], action: 'В поле имени — закрыть без подписи' },
    { keys: ['⌘', 'Z'], action: 'Отменить последний штрих (Ctrl+Z на Windows)' },
  ],
  a11y: [
    'Лист — фокусируемая группа «Подпись получателя, пусто» / «…, есть подпись»; подсказка про Enter и ⌘Z — через aria-describedby.',
    'Нарисовать с клавиатуры нельзя, поэтому Enter открывает поле «Имя для подписи»: набранное имя — равноценная подпись.',
    'Ошибка связана с листом (aria-invalid, aria-describedby) и объявляется live-region.',
    '«Очистить» без подтверждения, но с плашкой «Отменить» на 7 с; удаление и архив принятой — только из «Ещё», через диалог.',
    'Лист — touch-action: none: рисование пальцем не прокручивает страницу.',
    'Лист светлый и в тёмной теме: подпись уходит в PDF, чернила должны быть тёмными.',
  ],
  motion: [
    { label: 'Штрих', value: 'линия идёт за пальцем 1:1, кадр на requestAnimationFrame', easing: 'instant' },
    { label: 'Подсказка', value: 'гаснет на первом касании · 100 мс · ease-out', easing: 'ease-out', tokens: ['duration-fast'] },
    { label: 'Принятие', value: 'карточка проявляется на месте поля · 200 мс · ease-out', easing: 'ease-out', reduced: 'короче, без сдвигов', tokens: ['duration-base'] },
  ],
  examples: [
    { id: 'delivery', title: 'Акт приёмки', description: 'Подписать, принять, меню принятой; «Очистить» и «Подписать заново» — с плашкой «Отменить», архив и удаление — через диалог.' },
    { id: 'states', title: 'Отключено и принята', description: 'Причина под отключённым полем; карточка принятой подписи.' },
  ],
};

export default meta;
