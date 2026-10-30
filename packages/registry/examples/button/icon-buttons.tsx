import { Bell, Pencil, Settings2, Trash2 } from 'lucide-react';
import { CloseButton, IconButton, Tooltip } from '@/kvant';

export default function ButtonIconButtons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Tooltip content="Изменить" shortcut="E">
        <IconButton aria-label="Изменить" icon={<Pencil />} />
      </Tooltip>
      <Tooltip content="Уведомления">
        <IconButton variant="secondary" aria-label="Уведомления" icon={<Bell />} />
      </Tooltip>
      <Tooltip content="Настройки">
        <IconButton variant="soft" size="lg" aria-label="Настройки" icon={<Settings2 />} />
      </Tooltip>
      <Tooltip content="Удалить">
        <IconButton variant="danger-soft" size="sm" aria-label="Удалить" icon={<Trash2 />} />
      </Tooltip>
      <CloseButton />
      <CloseButton appearance="filled" />
    </div>
  );
}
