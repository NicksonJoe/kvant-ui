import { useState } from 'react';
import { Tag } from '@/kvant';
import type { Playground } from '@/kvant/meta';

function Demo({ label, selected, size, disabled }: { label: string; selected: boolean; size: 'sm' | 'md'; disabled: boolean }) {
  const [on, setOn] = useState(selected);
  return (
    <Tag selected={on} onSelectedChange={setOn} size={size} disabled={disabled}>
      {label}
    </Tag>
  );
}

const playground: Playground = {
  initial: { children: 'Просроченные' },
  render: (p) => (
    <Demo
      key={String(p.bool('selected'))}
      label={p.text('children')}
      selected={p.bool('selected')}
      size={p.pick('size', ['sm', 'md'] as const)}
      disabled={p.bool('disabled')}
    />
  ),
  code: (p) => `<Tag${p.attrs(['selected', 'size', 'disabled'])} onSelectedChange={setSelected}>${p.text('children')}</Tag>`,
};

export default playground;
