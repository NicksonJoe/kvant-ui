import { Bell } from 'lucide-react';
import { useState } from 'react';
import { CanvasAddStep, CanvasInsertMenu, CanvasNodeCard } from '@/kvant';
import { STEP_GROUPS } from '../step-palette/data';

export default function CanvasInsertMenuTab() {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<readonly string[]>([]);
  return (
    <div className="relative flex min-h-[520px] w-full flex-col items-center gap-4 rounded-xl bg-surface-2 p-8">
      <CanvasNodeCard kind="action" title="Создать сделку" summary="этап: Неразобранное" selected />
      {added.map((title, index) => (
        <CanvasNodeCard key={`${title}-${index}`} kind="action" title={title} />
      ))}
      <CanvasAddStep onClick={() => setOpen(true)} />
      {open ? (
        <CanvasInsertMenu
          className="absolute top-24"
          context="после «Создать сделку»"
          groups={STEP_GROUPS}
          suggestions={[{ template: { id: 'notify-manager', kind: 'action', title: 'Уведомить менеджера', icon: <Bell /> }, reason: 'чаще всего ставят после создания сделки' }]}
          templates={[{ id: 'notify-and-wait', kind: 'group', title: 'Уведомить и ждать ответа · 3 шага' }]}
          onInsert={(step) => {
            setAdded((current) => [...current, step.title]);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
