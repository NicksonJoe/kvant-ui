import { Globe } from 'lucide-react';
import { List, ListItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Валюта отчётов', value: 'Рубль, ₽' },
  controls: [
    { name: 'variant', type: 'enum', options: ['plain', 'inset'], default: 'plain', description: 'Вид списка (свойство List).' },
    { name: 'icon', type: 'boolean', default: true, description: 'Иконка в ведущем слоте.' },
  ],
  render: (p) => (
    <List variant={p.pick('variant', ['plain', 'inset'] as const)} className="w-full max-w-sm">
      <ListItem
        leading={p.bool('icon') ? <Globe /> : undefined}
        title={p.text('title')}
        subtitle={p.text('subtitle') || undefined}
        value={p.text('value') || undefined}
        chevron={p.bool('chevron')}
        selected={p.bool('selected') || undefined}
        destructive={p.bool('destructive')}
        disabled={p.bool('disabled')}
        onClick={() => {}}
      />
    </List>
  ),
  code: (p) => `<List${p.attrs(['variant'])}>
  <ListItem${p.bool('icon') ? ' leading={<Globe />}' : ''}${p.attrs(['title', 'subtitle', 'value', 'chevron', 'selected', 'destructive', 'disabled'])} onClick={openCurrency} />
</List>`,
};

export default playground;
