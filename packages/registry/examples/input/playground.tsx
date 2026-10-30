import { Search } from 'lucide-react';
import { Input } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { placeholder: 'Поиск клиентов' },
  controls: [{ name: 'icon', type: 'boolean', default: true, description: 'Иконка поиска в начале.' }],
  render: (p) => (
    <Input
      // remount when the starting value changes: it is uncontrolled
      key={p.text('defaultValue')}
      aria-label={p.text('placeholder') || 'Поле'}
      placeholder={p.text('placeholder')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      defaultValue={p.text('defaultValue')}
      kbd={p.text('kbd') || undefined}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      readOnly={p.bool('readOnly')}
      prefix={p.bool('icon') ? <Search /> : undefined}
      className="w-80 max-w-full"
    />
  ),
  code: (p) =>
    `<Input${p.attrs(['placeholder', 'size', 'defaultValue', 'kbd', 'invalid', 'disabled', 'readOnly'])}${p.bool('icon') ? ' prefix={<Search />}' : ''} />`,
};

export default playground;
