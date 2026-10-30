import { ChartColumn, House, Plus, Settings2, Users } from 'lucide-react';
import { useState } from 'react';
import { Button, CommandPalette, Kbd, toast } from '@/kvant';

export default function CommandPaletteCommands() {
  const [open, setOpen] = useState(false);
  const go = (title: string) => () => toast.add({ title });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} trailingIcon={<Kbd>⌘K</Kbd>}>
        Открыть палитру
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        // the page already owns ⌘K; a product app would leave the hotkey on
        hotkey={false}
        groups={[
          {
            label: 'Разделы',
            items: [
              { id: 'home', label: 'Обзор', icon: <House />, onSelect: go('Открыт обзор') },
              { id: 'deals', label: 'Сделки', icon: <ChartColumn />, shortcut: 'G D', onSelect: go('Открыты сделки') },
              { id: 'clients', label: 'Клиенты', icon: <Users />, shortcut: 'G C', onSelect: go('Открыты клиенты') },
            ],
          },
          {
            label: 'Действия',
            items: [
              { id: 'new-deal', label: 'Создать сделку', icon: <Plus />, shortcut: 'N', onSelect: go('Новая сделка') },
              { id: 'settings', label: 'Настройки студии', icon: <Settings2 />, keywords: ['профиль', 'команда'], onSelect: go('Открыты настройки') },
            ],
          },
        ]}
      />
    </>
  );
}
