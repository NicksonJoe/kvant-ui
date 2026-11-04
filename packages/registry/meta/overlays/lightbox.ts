import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'lightbox',
  status: 'beta',
  title: 'Просмотр медиа',
  description:
    'Полноэкранный просмотр фото и видео поверх страницы, всегда тёмный. Картинка вырастает из своей миниатюры и возвращается в неё; счётчик и имя файла, масштаб, скачивание, «Поделиться», стрелки и миниатюры; через 3 с без движения панели уходят. Закрывается Esc, кликом по фону и свайпом вниз.',
  category: 'overlays',
  paperBoard: 'G16-0',
  anatomy: [
    'Подложка media-bg',
    'Медиа: фото или видеоплеер',
    'Верхняя панель h40: счётчик, масштаб, скачать, поделиться',
    'Закрыть 40',
    'Стрелки 44',
    'Миниатюры 56 × 40',
  ],
  related: ['image', 'dialog', 'carousel', 'video-player', 'toast'],
  source: { file: 'components/lightbox.tsx', exports: ['Lightbox', 'LIGHTBOX_ZOOM'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['image', 'toast', 'video-player'] },
  props: [
    {
      name: 'items',
      type: 'object',
      signature: 'readonly GalleryItem[]',
      required: true,
      control: false,
      description: 'Фото и видео: src (у видео — постер), alt, имя файла; у видео ещё video и duration.',
    },
    { name: 'open', type: 'boolean', control: false, description: 'Управляемое открытие.' },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.' },
    { name: 'index', type: 'number', control: false, description: 'Управляемое текущее фото.' },
    { name: 'defaultIndex', type: 'number', options: [0, 1, 2, 3], default: 0, description: 'С какого фото открыть.' },
    { name: 'onIndexChange', type: 'function', signature: '(index: number) => void', description: 'Листание.' },
    {
      name: 'origin',
      type: 'function',
      signature: '(index: number) => Element | null | undefined',
      control: false,
      description: 'Миниатюра элемента: из неё медиа вырастает при открытии и в неё возвращается при закрытии. Нет миниатюры — прозрачность и масштаб.',
    },
    { name: 'actions', type: 'node', control: false, description: 'Свои кнопки в панели после «Поделиться»; открытое меню не даёт панелям уйти.' },
  ],
  slots: [
    { name: 'lightbox', description: 'Окно просмотра на весь экран; data-chrome="visible" | "hidden".' },
    { name: 'lightbox-stage', description: 'Сцена с медиа; клик по ней вне медиа закрывает, а при скрытых панелях — возвращает их.' },
    { name: 'lightbox-video', description: 'Обёртка видеоплеера 16:9 по размеру сцены.' },
    { name: 'lightbox-top-bar', description: 'Счётчик, масштаб, скачать, поделиться, закрыть.' },
    { name: 'lightbox-arrow', description: 'Стрелка 44 у края; на крайнем фото скрыта.' },
    { name: 'lightbox-thumbnails', description: 'Лента миниатюр, текущая в кольце.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Фон media-bg, хром — тёмное стекло; фокус возвращается на превью.' },
    {
      id: 'collapsed',
      label: 'панели скрыты',
      description: 'Через 3 с без движения: data-chrome="hidden", курсор прячется. Движение, касание или клавиша возвращают панели.',
    },
  ],
  keyboard: [
    { keys: ['←', '→'], action: 'Соседнее фото; в фокусе плеера — перемотка видео' },
    { keys: ['Esc'], action: 'Закрывает' },
    { keys: ['Tab'], action: 'Панель, стрелки, миниатюры; пока фокус на них, панели не уходят' },
  ],
  a11y: [
    'role="dialog" с названием по имени файла; фокус внутри, после закрытия — на превью.',
    'Стрелки называют соседний кадр: «Следующее фото», «Предыдущее видео»; на краю стрелка скрыта, а не выключена.',
    'Миниатюра текущего кадра — aria-current, у видео — «Видео N: …».',
    'Панели не уходят, пока на них фокус с клавиатуры, курсор или открыто меню из actions.',
    '«Поделиться» сразу открывает системное окно: с файлом, если он успел прочитаться, пока кадр на экране, иначе со ссылкой; без окна ссылка копируется и об этом говорит тост.',
    'Кольцо фокуса — ring тёмной темы в любой теме.',
  ],
  motion: [
    {
      label: 'Открытие из миниатюры',
      value: 'общий элемент: сдвиг, масштаб и обрезка по миниатюре · spring gentle 500 мс',
      note: 'При закрытии — обратно в миниатюру текущего фото',
      reduced: 'только прозрачность',
      easing: 'spring-gentle',
      tokens: ['spring-gentle'],
    },
    { label: 'Открытие без миниатюры', value: 'прозрачность + масштаб .96 → 1 · 200 мс · ease-out', reduced: 'только прозрачность', tokens: ['duration-base'] },
    { label: 'Фон', value: 'прозрачность · 200 мс · ease-out', tokens: ['duration-base'] },
    { label: 'Масштаб', value: '250 мс · ease-fluid', tokens: ['duration-moderate'] },
    { label: 'Панели', value: 'уходят через 3 с бездействия · прозрачность 150 мс', tokens: ['duration-quick'] },
    { label: 'Свайп вниз', value: 'идёт за пальцем; больше 30 % высоты — закрывает' },
  ],
  examples: [
    { id: 'photos', title: 'Фото со съёмки', description: 'Кнопка открывает три фото с миниатюрами.' },
    { id: 'media', title: 'Фото и видео', description: 'Медиа вырастает из миниатюры; видео играет в плеере.' },
    { id: 'single', title: 'Одно фото', description: 'Без стрелок и миниатюр.' },
  ],
};

export default meta;
