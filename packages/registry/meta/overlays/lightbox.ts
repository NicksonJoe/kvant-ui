import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'lightbox',
  status: 'beta',
  title: 'Просмотр медиа',
  description:
    'Полноэкранный просмотр фото поверх страницы, всегда тёмный. Счётчик и имя файла, масштаб, скачивание, стрелки и миниатюры; закрывается Esc, кликом по фону и свайпом вниз.',
  category: 'overlays',
  paperBoard: 'G16-0',
  anatomy: ['Подложка media-bg', 'Медиа', 'Верхняя панель: счётчик, масштаб, скачать', 'Закрыть 40', 'Стрелки 44', 'Миниатюры 56 × 40'],
  related: ['image', 'dialog', 'carousel'],
  source: { file: 'components/lightbox.tsx', exports: ['Lightbox', 'LIGHTBOX_ZOOM'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['image'] },
  props: [
    { name: 'items', type: 'object', signature: 'readonly GalleryItem[]', required: true, control: false, description: 'Фото: src, alt и имя файла.' },
    { name: 'open', type: 'boolean', control: false, description: 'Управляемое открытие.' },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.' },
    { name: 'index', type: 'number', control: false, description: 'Управляемое текущее фото.' },
    { name: 'defaultIndex', type: 'number', options: [0, 1, 2, 3], default: 0, description: 'С какого фото открыть.' },
    { name: 'onIndexChange', type: 'function', signature: '(index: number) => void', description: 'Листание.' },
    { name: 'actions', type: 'node', control: false, description: 'Свои кнопки в панели после «Скачать».' },
  ],
  slots: [
    { name: 'lightbox', description: 'Окно просмотра на весь экран.' },
    { name: 'lightbox-stage', description: 'Сцена с фото; клик по ней вне фото закрывает.' },
    { name: 'lightbox-top-bar', description: 'Счётчик, масштаб, скачать, закрыть.' },
    { name: 'lightbox-thumbnails', description: 'Лента миниатюр, текущая в кольце.' },
  ],
  states: [{ id: 'open', label: 'открыто', description: 'Фон media-bg, хром — тёмное стекло; фокус возвращается на превью.' }],
  keyboard: [
    { keys: ['←', '→'], action: 'Соседнее фото' },
    { keys: ['Esc'], action: 'Закрывает' },
    { keys: ['Tab'], action: 'Панель, стрелки, миниатюры' },
  ],
  a11y: [
    'role="dialog" с названием по имени файла; фокус внутри, после закрытия — на превью.',
    'Стрелка на краю скрыта, а не выключена; миниатюра текущего фото — aria-current.',
    'Кольцо фокуса — ring тёмной темы в любой теме.',
  ],
  motion: [
    { label: 'Открытие', value: 'прозрачность · 200 мс · ease-out', tokens: ['duration-base'] },
    { label: 'Масштаб', value: '250 мс · ease-fluid', tokens: ['duration-moderate'] },
    { label: 'Свайп вниз', value: 'идёт за пальцем; больше 30 % высоты — закрывает' },
  ],
  examples: [
    { id: 'photos', title: 'Фото со съёмки', description: 'Кнопка открывает три фото с миниатюрами.' },
    { id: 'single', title: 'Одно фото', description: 'Без стрелок и миниатюр.' },
  ],
};

export default meta;
