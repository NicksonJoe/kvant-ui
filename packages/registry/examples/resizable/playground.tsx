import { Resizable } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Ширина списка' },
  render: (p) => {
    const vertical = p.pick('orientation', ['horizontal', 'vertical'] as const) === 'vertical';
    return (
      <Resizable
        key={`${p.num('defaultValue')}-${p.num('min')}-${p.num('max')}`}
        label={p.text('label')}
        orientation={vertical ? 'vertical' : 'horizontal'}
        defaultValue={p.pick('defaultValue', [30, 40, 50] as const)}
        min={p.pick('min', [10, 20, 30] as const)}
        max={p.pick('max', [70, 80, 90] as const)}
        className="h-44 w-full max-w-md overflow-hidden rounded-xl bg-surface-1 shadow-raised"
      >
        <div className="grid h-full place-items-center text-body-sm text-fg-2">Список</div>
        <div className="grid h-full place-items-center bg-surface-2 text-body-sm text-fg-2">Карточка</div>
      </Resizable>
    );
  },
  code: (p) => `<Resizable${p.attrs(['label', 'orientation', 'defaultValue', 'min', 'max'])}>
  <div>Список</div>
  <div>Карточка</div>
</Resizable>`,
};

export default playground;
