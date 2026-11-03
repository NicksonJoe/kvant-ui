import { TreeSelect } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { regions } from './data';

const playground: Playground = {
  initial: { placeholder: 'Выберите регион' },
  render: (p) =>
    p.bool('multiple') ? (
      <TreeSelect
        multiple
        aria-label="Регион"
        nodes={regions}
        searchable={p.bool('searchable')}
        placeholder={p.text('placeholder')}
        disabled={p.bool('disabled')}
        invalid={p.bool('invalid')}
        className="w-104 max-w-full"
      />
    ) : (
      <TreeSelect
        aria-label="Регион"
        nodes={regions}
        searchable={p.bool('searchable')}
        placeholder={p.text('placeholder')}
        disabled={p.bool('disabled')}
        invalid={p.bool('invalid')}
        className="w-104 max-w-full"
      />
    ),
  code: (p) => `<TreeSelect aria-label="Регион" nodes={regions}${p.attrs(['multiple', 'searchable', 'placeholder', 'disabled', 'invalid'])} />`,
};

export default playground;
