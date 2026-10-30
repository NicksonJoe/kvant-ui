import { Input, InputAddon } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'https://', variant: 'segment' },
  controls: [{ name: 'side', type: 'enum', options: ['start', 'end'], default: 'start', description: 'В начале или в конце поля.' }],
  render: (p) => {
    const addon = <InputAddon variant={p.pick('variant', ['inline', 'segment'] as const)}>{p.text('children')}</InputAddon>;
    const start = p.pick('side', ['start', 'end'] as const) === 'start';
    return (
      <Input
        aria-label="Адрес"
        defaultValue={start ? 'norda.ru/brief/sever' : 'studio-sever'}
        prefix={start ? addon : undefined}
        suffix={start ? undefined : addon}
        className="w-80 max-w-full"
      />
    );
  },
  code: (p) => {
    const addon = `<InputAddon${p.attrs(['variant'])}>${p.text('children')}</InputAddon>`;
    return p.pick('side', ['start', 'end'] as const) === 'start'
      ? `<Input defaultValue="norda.ru/brief/sever" prefix={${addon}} />`
      : `<Input defaultValue="studio-sever" suffix={${addon}} />`;
  },
};

export default playground;
