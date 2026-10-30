import { CalendarPlus, NotebookPen, Plus, SquareCheck, UserPlus } from 'lucide-react';
import { FabMenu, toast } from '@/kvant';

const created = (title: string) => () => toast.add({ title, type: 'success' });

export default function FabSpeedDial() {
  return (
    <div className="relative h-96 w-full max-w-90 overflow-hidden rounded-3xl bg-surface-1 shadow-raised">
      <p className="px-4 pt-6 text-heading-lg font-semibold text-fg-1">Задачи</p>
      <p className="px-4 pt-1 text-body-sm text-fg-3">Шесть задач на эту неделю</p>
      <FabMenu
        icon={<Plus />}
        label="Создать"
        className="absolute right-4 bottom-4"
        actions={[
          { label: 'Заметка', icon: <NotebookPen />, onClick: created('Заметка создана') },
          { label: 'Контакт', icon: <UserPlus />, onClick: created('Контакт добавлен') },
          { label: 'Встреча', icon: <CalendarPlus />, onClick: created('Встреча в календаре') },
          { label: 'Задача', icon: <SquareCheck />, onClick: created('Задача создана') },
        ]}
      />
    </div>
  );
}
