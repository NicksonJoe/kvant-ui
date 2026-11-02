import { useState } from 'react';
import { Gallery, Lightbox } from '@/kvant';

const sketch = (sky: string, sea: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="${sky}"/><circle cx="220" cy="270" r="120" fill="#fbf3dc"/><rect y="400" width="600" height="200" fill="${sea}"/></svg>`,
  )}`;

const sketches = [
  { src: sketch('#a9c8f5', '#2f5fae'), alt: 'Обложка: кит под луной', name: 'Обложка v3.png' },
  { src: sketch('#f6d3bd', '#c2643a'), alt: 'Разворот 1: закат над морем', name: 'Разворот 1.png' },
  { src: sketch('#bfe6dc', '#2f8f78'), alt: 'Разворот 2: лагуна', name: 'Разворот 2.png' },
  { src: sketch('#f1cde0', '#b04f86'), alt: 'Разворот 3: коралловый риф', name: 'Разворот 3.png' },
  { src: sketch('#efe0b4', '#a8812a'), alt: 'Разворот 4: песчаный берег', name: 'Разворот 4.png' },
  { src: sketch('#d6d3f4', '#5a50b8'), alt: 'Разворот 5: ночное небо', name: 'Разворот 5.png' },
  { src: sketch('#cfe3f7', '#3a6fa8'), alt: 'Форзац', name: 'Форзац.png' },
];

export default function ImageGallery() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <div className="w-full max-w-sm">
      <Gallery
        items={sketches}
        onOpen={(next) => {
          setIndex(next);
          setOpen(true);
        }}
      />
      <Lightbox items={sketches} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} />
    </div>
  );
}
