import { Copy, Pencil, Trash2 } from 'lucide-react';
import { IconButton, Tooltip, TooltipProvider } from '@/kvant';

export default function TooltipShortcuts() {
  return (
    <TooltipProvider>
      <div className="flex gap-1">
        <Tooltip content="Изменить" shortcut="E">
          <IconButton aria-label="Изменить" icon={<Pencil />} />
        </Tooltip>
        <Tooltip content="Дублировать" shortcut="⌘D">
          <IconButton aria-label="Дублировать" icon={<Copy />} />
        </Tooltip>
        <Tooltip content="Удалить" shortcut="⌫">
          <IconButton aria-label="Удалить" icon={<Trash2 />} />
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
