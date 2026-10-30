import { ColorPicker } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const swatches = ['#3986E4', '#C2612C', '#2A9D8F', '#A38A1B', '#C2509A', '#4E9A3C', '#8B63D9', '#D2544B'];

const playground: Playground = {
  render: (p) => (
    <ColorPicker aria-label="Цвет метки" swatches={swatches} opaque={p.bool('opaque')} disabled={p.bool('disabled')} className="w-55 max-w-full" />
  ),
  code: (p) => `<ColorPicker
  aria-label="Цвет метки"${p.attrs(['opaque', 'disabled'])}
  swatches={['#3986E4', '#C2612C', '#2A9D8F', '#A38A1B', '#C2509A', '#4E9A3C', '#8B63D9', '#D2544B']}
/>`,
};

export default playground;
