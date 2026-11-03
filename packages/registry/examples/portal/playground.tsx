import { useState } from 'react';
import { Button, LAYERS, Portal, type Layer } from '@/kvant';
import type { Playground } from '@/kvant/meta';

function Demo({ layer }: { layer: Layer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? 'Убрать слой' : 'Показать слой'}
      </Button>
      {open ? (
        <Portal layer={layer}>
          <div className="fixed bottom-6 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full bg-fg-1 px-4 text-label-md font-medium text-surface-1 shadow-tooltip">
            {layer}
            <span className="font-mono text-caption text-fg-4 tabular-nums">z {LAYERS[layer]}</span>
          </div>
        </Portal>
      ) : null}
    </>
  );
}

const playground: Playground = {
  initial: { layer: 'dropdown' },
  render: (p) => <Demo layer={p.pick('layer', Object.keys(LAYERS) as Layer[])} />,
  code: (p) => `<Portal layer="${p.pick('layer', Object.keys(LAYERS) as Layer[])}">
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2">…</div>
</Portal>`,
};

export default playground;
