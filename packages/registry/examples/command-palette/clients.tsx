import { useState } from 'react';
import { Avatar, Button, CommandPalette, toast } from '@/kvant';

const clients = [
  { id: 'c1', name: 'Ольга Миронова', company: 'Пекарня «Хлебница»', deals: '2 сделки' },
  { id: 'c2', name: 'Игорь Лебедев', company: 'Яхт-клуб «Парус»', deals: '1 сделка' },
  { id: 'c3', name: 'Дарья Ким', company: 'Чайная «Листва»', deals: '4 сделки' },
];

export default function CommandPaletteClients() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Найти клиента
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        hotkey={false}
        placeholder="Имя, компания или телефон"
        groups={[
          {
            label: 'Клиенты',
            items: clients.map((client) => ({
              id: client.id,
              label: client.name,
              hint: `${client.company} · ${client.deals}`,
              icon: <Avatar name={client.name} size={24} />,
              keywords: [client.company],
              onSelect: () => toast.add({ title: client.name, description: client.company }),
            })),
          },
        ]}
      />
    </>
  );
}
