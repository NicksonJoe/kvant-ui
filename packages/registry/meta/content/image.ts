import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'image',
  status: 'beta',
  title: 'Изображение',
  description:
    'Картинка в рамке пропорций: держит место до загрузки, плавно проявляется и не сдвигает страницу. Галерея превью открывает просмотр медиа.',
  category: 'content',
  paperBoard: 'G16-0',
  anatomy: ['Рамка пропорций', 'Изображение object-fit: cover', 'Заглушка: мерцание или ошибка', 'Подпись 10 ниже'],
  related: ['lightbox', 'carousel', 'skeleton'],
  source: { file: 'components/image.tsx', exports: ['Image', 'Gallery', 'IMAGE_RATIOS'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'src', type: 'string', required: true, control: false, description: 'Адрес картинки.' },
    { name: 'alt', type: 'string', required: true, description: 'Что изображено; пустая строка — только для декора.' },
    {
      name: 'ratio',
      type: 'enum',
      options: ['1:1', '4:3', '16:9', '21:9'],
      default: '16:9',
      description: 'Пропорции рамки, картинка обрезается по cover; без ratio — свои пропорции.',
    },
    {
      name: 'radius',
      type: 'enum',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      default: 'lg',
      description: 'По короткой стороне: ≤ 64 — sm, ≤ 160 — md, ≤ 320 — lg, больше — xl; full для аватаров.',
    },
    { name: 'caption', type: 'node', description: 'Подпись 12/16 fg-3 под картинкой, figcaption.' },
  ],
  parts: [
    {
      name: 'Gallery',
      description: 'Сетка превью: первое фото 2 × 2, остальные квадраты, хвост сворачивается в «+N».',
      props: [
        { name: 'items', type: 'object', signature: 'readonly GalleryItem[]', required: true, description: 'Фото: src, alt и имя файла.' },
        { name: 'max', type: 'number', default: 5, description: 'Сколько плиток видно; последняя показывает «+N».' },
        { name: 'onOpen', type: 'function', signature: '(index: number) => void', description: 'Нажатое фото — откройте на нём Lightbox.' },
      ],
    },
  ],
  slots: [
    { name: 'image', description: 'figure: рамка и подпись.' },
    { name: 'image-frame', description: 'Рамка пропорций; data-state="loading" | "loaded" | "error".' },
    { name: 'gallery', description: 'Сетка превью.' },
  ],
  states: [
    { id: 'loading', label: 'загрузка', description: 'Рамка fill-2 с мерцанием 2000 мс, появляется через 300 мс.' },
    { id: 'rest', label: 'загружено', description: 'Картинка проявляется 0 → 1 за 200 мс, без сдвига.' },
    { id: 'invalid', label: 'ошибка', description: 'surface-2, иконка, «Не удалось загрузить» и «Повторить».' },
  ],
  keyboard: [{ keys: ['Tab'], action: 'Галерея: по плиткам; «Повторить» в ошибке' }],
  a11y: [
    'alt обязателен: пустой только у декоративной картинки и у превью внутри кнопки с названием.',
    'Плитка галереи — кнопка «Открыть: …», свёрнутая — «Ещё N фото».',
    'Пропорции заданы до загрузки, поэтому страница не прыгает.',
  ],
  motion: [
    { label: 'Загрузка', value: 'мерцание 2000 мс linear', reduced: 'статичная заливка', tokens: ['duration-shimmer'] },
    { label: 'Появление', value: 'прозрачность 0 → 1 · 200 мс · ease-out', tokens: ['duration-base'] },
    { label: 'Наведение на плитку', value: 'затемнение 20 % · 150 мс', tokens: ['duration-fast'] },
  ],
  examples: [
    { id: 'ratios', title: 'Пропорции', description: '1:1, 4:3, 16:9 и 21:9 с подписями.' },
    { id: 'states', title: 'Загружено и ошибка', description: 'Битый адрес показывает «Повторить».' },
    { id: 'gallery', title: 'Галерея', description: 'Превью эскизов открывают просмотр медиа.' },
  ],
};

export default meta;
