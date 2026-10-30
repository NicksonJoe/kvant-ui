import { ArrowRight, Check, Plus, Trash } from 'lucide-react';
import { BUTTON_SIZES, BUTTON_VARIANTS, Button } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const ICONS = { plus: Plus, check: Check, trash: Trash } as const;
const ICON_TAGS: Record<keyof typeof ICONS, string> = { plus: 'Plus', check: 'Check', trash: 'Trash' };
const ICON_OPTIONS = ['none', 'plus', 'check', 'trash'] as const;

const playground: Playground = {
  initial: { children: 'Создать сделку' },
  controls: [
    { name: 'icon', type: 'enum', options: ICON_OPTIONS, default: 'none', description: 'Иконка перед подписью.' },
    { name: 'trailing', type: 'boolean', default: false, description: 'Стрелка после подписи.' },
  ],
  render: (p) => {
    const icon = p.pick('icon', ICON_OPTIONS);
    const Icon = icon === 'none' ? null : ICONS[icon];
    return (
      <Button
        variant={p.pick('variant', BUTTON_VARIANTS)}
        size={p.pick('size', BUTTON_SIZES)}
        loading={p.bool('loading')}
        disabled={p.bool('disabled')}
        leadingIcon={Icon ? <Icon /> : undefined}
        trailingIcon={p.bool('trailing') ? <ArrowRight /> : undefined}
      >
        {p.text('children')}
      </Button>
    );
  },
  code: (p) => {
    const icon = p.pick('icon', ICON_OPTIONS);
    const leading = icon === 'none' ? '' : ` leadingIcon={<${ICON_TAGS[icon]} />}`;
    const trailing = p.bool('trailing') ? ' trailingIcon={<ArrowRight />}' : '';
    return `<Button${p.attrs(['variant', 'size', 'loading', 'disabled'])}${leading}${trailing}>${p.text('children')}</Button>`;
  },
};

export default playground;
