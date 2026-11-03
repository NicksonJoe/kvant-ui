import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Button, FocusTrap, Input, Kbd } from '@/kvant';

export default function FocusManagementTrap() {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState('14:30');

  return (
    <div className="flex w-full max-w-96 flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-surface-1 shadow-raised">
        <div className="flex items-center gap-3 p-4">
          <Avatar name="Анна Соколова" size={40} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-label-md font-medium text-fg-1">Анна Соколова</span>
            <span className="text-body-xs text-fg-3 tabular-nums">Стрижка и укладка · {time}</span>
          </div>
          <Button variant="secondary" size="sm" leadingIcon={<Pencil />} aria-expanded={editing} onClick={() => setEditing(true)}>
            Изменить
          </Button>
        </div>
        {editing ? (
          <FocusTrap
            aria-label="Перенести запись"
            role="group"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setEditing(false);
            }}
            className="flex flex-col gap-3 border-t border-separator p-4"
          >
            <span className="text-label-md font-medium text-fg-1">Перенести запись</span>
            <Input aria-label="Время" value={time} onChange={(event) => setTime(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={() => setEditing(false)}>
                Сохранить
              </Button>
            </div>
          </FocusTrap>
        ) : null}
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-fg-3">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Tab</Kbd> вперёд
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>⇧ Tab</Kbd> назад
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Esc</Kbd> закрыть и вернуть фокус
        </span>
      </p>
    </div>
  );
}
