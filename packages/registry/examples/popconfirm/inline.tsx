import { Trash2 } from 'lucide-react';
import { IconButton, Popconfirm, toast } from '@/kvant';

export default function PopconfirmInline() {
  return (
    <div className="flex h-control-xl w-85 max-w-full items-center gap-3 rounded-md bg-surface-1 pr-3 pl-4 shadow-[0_0_0_1px_var(--color-hairline)]">
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-fg-1">Счёт № 309 · черновик</span>
      <span className="text-body-sm text-fg-2 tabular-nums">48 000 ₽</span>
      <Popconfirm
        size="sm"
        tone="danger"
        side="top"
        align="end"
        title="Удалить черновик?"
        onConfirm={() => toast.add({ title: 'Черновик удалён', timeout: 7000, actionProps: { children: 'Отменить' } })}
      >
        <IconButton variant="secondary" size="sm" aria-label="Удалить черновик" icon={<Trash2 aria-hidden />} />
      </Popconfirm>
    </div>
  );
}
