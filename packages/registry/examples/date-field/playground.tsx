import { DateField } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => <DateField aria-label="Дата договора" disabled={p.bool('disabled')} className="w-47 max-w-full" />,
  code: (p) => `<DateField aria-label="Дата договора"${p.attrs(['disabled'])} />`,
};

export default playground;
