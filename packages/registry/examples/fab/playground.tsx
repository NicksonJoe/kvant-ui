import { Plus } from 'lucide-react';
import { Fab } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Новая задача' },
  render: (p) => (
    <Fab icon={<Plus />} label={p.text('label')} extended={p.bool('extended')} disabled={p.bool('disabled')} />
  ),
  code: (p) => `<Fab icon={<Plus />}${p.attrs(['label', 'extended', 'disabled'])} />`,
};

export default playground;
