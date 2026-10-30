import { SearchField } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { placeholder: 'Поиск по проектам', shortcut: '/' },
  render: (p) => (
    <SearchField
      // remount when the starting query changes: it is uncontrolled
      key={p.text('defaultValue')}
      aria-label="Поиск по проектам"
      placeholder={p.text('placeholder')}
      defaultValue={p.text('defaultValue')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      loading={p.bool('loading')}
      shortcut={p.text('shortcut') || undefined}
      disabled={p.bool('disabled')}
      className="w-72 max-w-full"
    />
  ),
  code: (p) => `<SearchField${p.attrs(['placeholder', 'defaultValue', 'size', 'loading', 'shortcut', 'disabled'])} onSearch={search} />`,
};

export default playground;
