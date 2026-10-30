import { DatePicker } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <DatePicker
      aria-label="Дата встречи"
      placeholder={p.text('placeholder')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      disabled={p.bool('disabled')}
      className="w-72 max-w-full"
    />
  ),
  code: (p) => `<DatePicker aria-label="Дата встречи"${p.attrs(['placeholder', 'size', 'disabled'])} />`,
};

export default playground;
