import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'qr-code',
  status: 'beta',
  title: 'QR-код',
  description:
    'Мост между экраном и телефоном: оплатить счёт, открыть сделку в мобильной Норде, подключить мессенджер. Кодировщик свой, без зависимостей: байтовый режим UTF-8, коды Рида — Соломона, наименьшая версия 1–40 под уровень коррекции, лучшая из восьми масок. Модули всегда тёмные на белой плашке с полем в 4 модуля — даже в тёмной теме. Рядом с кодом всегда подпись и та же ссылка текстом, чтобы её можно было скопировать: телефон не отсканирует собственный экран.',
  category: 'data-display',
  paperBoard: '1DPV-0',
  anatomy: [
    'Плашка #FFFFFF + hairline, r8 (sm) / r12 (md+)',
    'Поле 4 модуля',
    'Модули #14171C, crispEdges',
    'Логотип в центре: белая подложка 22,5 % плашки',
    'Поверх истёкшего кода: «Код истёк» и «Обновить»',
  ],
  related: ['copy-button', 'card', 'dialog', 'spinner'],
  source: {
    file: 'components/qr-code.tsx',
    exports: ['QrCode', 'encodeQr', 'qrCodeToDataUrl', 'QR_CODE_SIZES', 'QR_CODE_STATES', 'QR_LEVELS'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['button', 'visually-hidden'] },
  props: [
    {
      name: 'value',
      type: 'string',
      required: true,
      description:
        'Что откроет камера: ссылка или любой текст, кодируется в UTF-8. Чем длиннее, тем больше версия и мельче модули — короткая ссылка вида norda.cloud/pay/7Kx2-318 читается лучше полной с utm.',
    },
    {
      name: 'size',
      type: 'enum',
      options: ['sm', 'md', 'lg', 'xl'],
      default: 'lg',
      description: 'Плашка вместе с полем: sm 96 в строке, md 144 в поповере, lg 200 в карточке и диалоге, xl 280 на экране подключения. На печати — не меньше 2 × 2 см.',
    },
    { name: 'level', type: 'enum', options: ['L', 'M', 'Q', 'H'], description: 'Коррекция ошибок: L 7 %, M 15 %, Q 25 %, H 30 % кода можно потерять. По умолчанию M, с логотипом — H.' },
    {
      name: 'logo',
      type: 'node',
      control: false,
      description: 'Знак в центре на белой подложке 22,5 % плашки, r 25 %, внутри отступ 4. Включает коррекцию H, если level не задан явно.',
    },
    {
      name: 'state',
      type: 'enum',
      options: ['ready', 'loading', 'expired', 'error'],
      default: 'ready',
      description:
        'loading — плашка fill-1 держит место, на ней контуры трёх угловых меток и спиннер 28; expired — код размыт, поверх «Код истёк»; error — «Не удалось создать код». Слишком длинное value само даёт error.',
    },
    { name: 'onRefresh', type: 'function', signature: '() => void', description: '«Обновить» поверх истёкшего или несозданного кода; без обработчика кнопки нет.' },
    { name: 'aria-label', type: 'string', default: 'QR-код', description: 'Имя картинки: «QR-код: оплата счёта № 318».' },
    { name: 'className', type: 'string', control: false, description: 'Корень — плашка.' },
  ],
  parts: [
    {
      name: 'encodeQr',
      description:
        'Матрица без отрисовки: (value, { level, mask }) → { version, level, mask, size, modules[y][x] }. Бросает RangeError, если value не помещается в версию 40 на этом уровне (2953 байта при L, 1273 при H).',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Текст, кодируется в UTF-8 байтовым режимом.' },
        { name: 'level', type: 'enum', options: ['L', 'M', 'Q', 'H'], default: 'M', description: 'Уровень коррекции; версия подбирается наименьшая, уровень сам не повышается.' },
        {
          name: 'mask',
          type: 'number',
          description: 'Маска 0–7; по умолчанию — с наименьшим штрафом по ISO/IEC 18004: серии от 5, блоки 2 × 2, ложные угловые метки (поле считается светлым), доля тёмного.',
        },
      ],
    },
    {
      name: 'qrCodeToDataUrl',
      description: 'PNG для «Скачать PNG» и печати: (value, { size = 1024, level }) → data:image/png. Та же белая плашка, поле 4 модуля, модули на целых пикселях. Только в браузере: рисует на canvas.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Текст кода.' },
        { name: 'size', type: 'number', default: 1024, description: 'Сторона PNG вместе с полем, px.' },
        { name: 'level', type: 'enum', options: ['L', 'M', 'Q', 'H'], default: 'M', description: 'Уровень коррекции.' },
      ],
    },
  ],
  slots: [
    { name: 'qr-code', description: 'Плашка: data-size, data-state, data-level; aria-busy при загрузке.' },
    { name: 'qr-code-modules', description: 'Один path тёмных модулей поверх белого прямоугольника в svg role="img".' },
    { name: 'qr-code-logo', description: 'Белая подложка знака в центре, aria-hidden.' },
    { name: 'qr-code-finder', description: 'Контур угловой метки на плашке загрузки.' },
    { name: 'qr-code-spinner', description: 'Спиннер 28 на плашке загрузки: дорожка fill-3, дуга accent.' },
    { name: 'qr-code-overlay', description: 'Поверх истёкшего или несозданного кода: текст 14/20 600 и «Обновить» accent 32.' },
  ],
  states: [
    { id: 'rest', label: 'готов', description: 'Белая плашка, модули #14171C, поле 4 модуля.' },
    { id: 'loading', label: 'загрузка', description: 'Плашка fill-1 на месте кода, контуры трёх угловых меток и спиннер — раскладка не прыгает.', props: { state: 'loading' } },
    { id: 'disabled', label: 'истёк', description: 'Код blur 3 и opacity .35, поверх «Код истёк» и «Обновить».', props: { state: 'expired' } },
    { id: 'invalid', label: 'ошибка', description: 'Пустая белая плашка, «Не удалось создать код» и «Обновить».', props: { state: 'error' } },
  ],
  keyboard: [{ keys: ['Tab'], action: 'К «Обновить» поверх истёкшего кода; сам код не фокусируется' }],
  a11y: [
    'Код — svg role="img" с aria-label: «QR-код: оплата счёта № 318». Модули диктор не прочтёт, поэтому та же ссылка всегда стоит рядом текстом с «Копировать».',
    'Истечение и обновление объявляются вежливо (aria-live="polite"): «Код истёк», «Не удалось создать код», «Код обновлён».',
    'Модули не красим в акцент и не инвертируем на тёмном фоне — часть камер перестаёт читать код. На тёмной поверхности плашка остаётся белой.',
    'QR на телефоне не бывает единственным путём: там нужна кнопка или ссылка.',
    'Плашка загрузки держит размер кода, поэтому соседний текст не сдвигается, когда код готов.',
  ],
  motion: [
    { label: 'Код', value: 'без анимации', note: 'Новый код просто заменяет старый: мигание мешает камере навестись.' },
    { label: 'Спиннер загрузки', value: 'поворот · 800 мс · linear', easing: 'linear', reduced: '1600 мс', tokens: ['duration-spinner'] },
  ],
  examples: [
    { id: 'payment', title: 'Блок QR со ссылкой', description: 'Код 200, подпись, ссылка с «Копировать», «Скачать PNG» и срок действия.' },
    { id: 'sizes', title: 'Размеры', description: 'sm 96 в строке, md 144 в поповере, lg 200 в карточке.' },
    { id: 'states', title: 'Логотип, истёк, загрузка, тёмный фон', description: 'Коррекция H под знаком, «Обновить» с загрузкой нового кода, белая плашка на media-bg.' },
  ],
};

export default meta;
