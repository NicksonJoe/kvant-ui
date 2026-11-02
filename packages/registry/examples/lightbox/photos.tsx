import { useState } from 'react';
import { Button, Lightbox } from '@/kvant';

const photo = (sky: string, ground: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${sky}"/><circle cx="1150" cy="320" r="150" fill="#fbf3dc"/><path d="M0 700 420 420l340 300 300-220 540 320v220H0z" fill="${ground}"/></svg>`,
  )}`;

const photos = [
  { src: photo('#a9c8f5', '#2f5fae'), alt: 'Набережная утром', name: 'Набережная.jpg' },
  { src: photo('#f6d3bd', '#c2643a'), alt: 'Вход в офис «Полюса»', name: 'Вход.jpg' },
  { src: photo('#bfe6dc', '#2f8f78'), alt: 'Переговорная на втором этаже', name: 'Переговорная.jpg' },
];

export default function LightboxPhotos() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Фото со съёмки · 3
      </Button>
      <Lightbox items={photos} open={open} onOpenChange={setOpen} />
    </>
  );
}
