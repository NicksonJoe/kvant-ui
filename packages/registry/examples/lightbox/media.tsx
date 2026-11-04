import { useRef, useState } from 'react';
import { Image, Lightbox } from '@/kvant';
import clip from '../video-player/clip.mp4';

const frame = (sky: string, ground: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${sky}"/><circle cx="1150" cy="320" r="150" fill="#fbf3dc"/><path d="M0 700 420 420l340 300 300-220 540 320v220H0z" fill="${ground}"/></svg>`,
  )}`;

const media = [
  { src: frame('#a9c8f5', '#2f5fae'), alt: 'Склад «Полюса» до ремонта', name: 'Склад до.jpg' },
  { src: frame('#bfe6dc', '#2f8f78'), alt: 'Склад после перехода на сканеры', name: 'Склад после.jpg' },
  { src: frame('#1e4a52', '#0f2b31'), alt: 'Интервью с основателем «Полюса»', name: 'Интервью.mp4', video: clip, duration: 20 },
];

export default function LightboxMedia() {
  const strip = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <div ref={strip} className="flex gap-2">
      {media.map((item, itemIndex) => (
        <button
          key={item.src}
          type="button"
          data-index={itemIndex}
          aria-label={`${item.video ? 'Смотреть' : 'Открыть'}: ${item.alt}`}
          onClick={() => {
            setIndex(itemIndex);
            setOpen(true);
          }}
          className="w-28 rounded-md"
        >
          <Image src={item.src} alt="" ratio="1:1" radius="md" className="pointer-events-none" />
        </button>
      ))}
      <Lightbox
        items={media}
        open={open}
        onOpenChange={setOpen}
        index={index}
        onIndexChange={setIndex}
        origin={(shown) => strip.current?.querySelector(`[data-index="${shown}"] [data-slot=image-frame]`)}
      />
    </div>
  );
}
