import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button, CommandPalette } from '@/kvant';
import type { Playground } from '@/kvant/meta';

function Demo({ placeholder }: { placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" leadingIcon={<Search />} onClick={() => setOpen(true)}>
        Открыть палитру
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        hotkey={false}
        placeholder={placeholder}
        groups={[
          {
            label: 'Разделы',
            items: [
              { id: 'deals', label: 'Сделки', onSelect: () => {} },
              { id: 'clients', label: 'Клиенты', onSelect: () => {} },
            ],
          },
        ]}
      />
    </>
  );
}

const playground: Playground = {
  render: (p) => <Demo placeholder={p.text('placeholder')} />,
  code: (p) => `<CommandPalette${p.attrs(['placeholder', 'hotkey'])}
  groups={[
    {
      label: 'Разделы',
      items: [
        { id: 'deals', label: 'Сделки', onSelect: () => navigate('/deals') },
        { id: 'clients', label: 'Клиенты', onSelect: () => navigate('/clients') },
      ],
    },
  ]}
/>`,
};

export default playground;
