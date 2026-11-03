import { Check, NotebookPen, Paperclip } from 'lucide-react';
import { useState } from 'react';
import { Button, Checkbox, FloatingPanel } from '@/kvant';

const items = ['Бюджет согласован — 1 280 000 ₽', 'Запуск — после 15 ноября', 'Запросить доступ к брендбуку'];

export default function FloatingPanelCallNotes() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState([true, true, false]);

  return (
    <>
      <Button variant="secondary" leadingIcon={<NotebookPen aria-hidden />} onClick={() => setOpen(true)} disabled={open}>
        Заметки к звонку
      </Button>
      <FloatingPanel
        open={open}
        onOpenChange={setOpen}
        title="Заметки к звонку"
        badge={`${done.filter(Boolean).length} из ${items.length}`}
        storageKey="kvant-docs-call-notes"
        footer={
          <>
            <Check aria-hidden className="size-3.5 stroke-2 text-success-soft-fg" />
            <span className="flex-1 text-caption text-fg-3 tabular-nums">Сохранено в 14:32</span>
            <Button variant="secondary" size="sm" leadingIcon={<Paperclip aria-hidden />}>
              К сделке
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-caption text-fg-3 tabular-nums">«Орбита Лаб» · созвон 14:00–14:30</p>
          <div className="flex flex-col gap-2.5">
            {items.map((item, index) => (
              <Checkbox
                key={item}
                checked={done[index]}
                onCheckedChange={(checked) => setDone((current) => current.map((value, i) => (i === index ? checked : value)))}
              >
                <span className={done[index] ? 'text-fg-2 line-through decoration-fg-4' : undefined}>{item}</span>
              </Checkbox>
            ))}
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}
