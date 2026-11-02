import { useState } from 'react';
import { Button, Lightbox } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const photo = (sky: string, ground: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${sky}"/><circle cx="1150" cy="320" r="150" fill="#fbf3dc"/><path d="M0 700 420 420l340 300 300-220 540 320v220H0z" fill="${ground}"/></svg>`,
  )}`;

const photos = [
  { src: photo('#a9c8f5', '#2f5fae'), alt: 'Набережная утром', name: 'Набережная.jpg' },
  { src: photo('#f6d3bd', '#c2643a'), alt: 'Вход в офис', name: 'Вход.jpg' },
  { src: photo('#bfe6dc', '#2f8f78'), alt: 'Переговорная', name: 'Переговорная.jpg' },
  { src: photo('#f1cde0', '#b04f86'), alt: 'Кухня', name: 'Кухня.jpg' },
];

function Demo({ defaultIndex }: { defaultIndex: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Открыть просмотр
      </Button>
      <Lightbox items={photos} open={open} onOpenChange={setOpen} defaultIndex={defaultIndex} />
    </>
  );
}

const playground: Playground = {
  render: (p) => <Demo key={p.num('defaultIndex')} defaultIndex={p.num('defaultIndex')} />,
  code: (p) => `<Lightbox items={photos} open={open} onOpenChange={setOpen}${p.attrs(['defaultIndex'])} />`,
};

export default playground;
