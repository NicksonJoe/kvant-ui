import { LAYERS, cn, type Layer } from '@/kvant';

const labels: Record<Layer, string> = {
  content: 'Контент',
  sticky: 'Липкая шапка',
  dropdown: 'Меню и поповеры',
  overlay: 'Затемнение',
  modal: 'Диалог и шит',
  toast: 'Тост',
  tooltip: 'Подсказка',
};

// Written top layer first: the order on screen comes from LAYERS, not from the markup.
const order = (Object.keys(LAYERS) as Layer[]).reverse();

export default function PortalLayers() {
  return (
    <div className="relative h-105 w-full max-w-160 overflow-hidden rounded-2xl bg-surface-2">
      {order.map((layer) => {
        const tooltip = layer === 'tooltip';
        // cards step 52 right and 42 down; the tooltip sits inside the toast card
        const step = tooltip ? 5 : Object.keys(LAYERS).indexOf(layer);
        return (
          <div
            key={layer}
            className={cn(
              'absolute flex items-start gap-2 text-body-sm',
              tooltip ? 'h-7 items-center rounded-full bg-fg-1 px-3 text-surface-1 shadow-tooltip' : 'h-34 w-75 rounded-xl px-3.5 py-3 shadow-overlay',
              layer === 'overlay' ? 'bg-scrim text-fg-1' : !tooltip && 'bg-surface-1 text-fg-1',
            )}
            style={{ zIndex: LAYERS[layer], left: 32 + 52 * step + (tooltip ? 52 : 0), top: 32 + 42 * step + (tooltip ? 60 : 0) }}
          >
            <span className={cn('font-mono text-caption tabular-nums', tooltip ? 'text-fg-4' : 'text-fg-3')}>{LAYERS[layer]}</span>
            {labels[layer]}
          </div>
        );
      })}
    </div>
  );
}
