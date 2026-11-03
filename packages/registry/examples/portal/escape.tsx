import { StickyNote } from 'lucide-react';
import { useState } from 'react';
import { Button, CloseButton, Portal, Switch } from '@/kvant';

function Note({ onClose }: { onClose: () => void }) {
  return (
    <section aria-label="Заметка к сделке" className="fixed right-6 bottom-6 flex w-72 flex-col gap-1.5 rounded-2xl bg-overlay py-3 pr-2 pl-4 shadow-overlay">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-md font-medium text-fg-1">Заметка к сделке</span>
        <CloseButton aria-label="Закрыть заметку" onClick={onClose} />
      </div>
      <p className="pr-2 pb-1 text-body-sm text-fg-2">Клиент просит счёт до пятницы и скидку 5 % за предоплату.</p>
    </section>
  );
}

export default function PortalEscape() {
  const [open, setOpen] = useState(false);
  const [portal, setPortal] = useState(true);
  const note = open ? <Note onClose={() => setOpen(false)} /> : null;

  return (
    <div className="flex w-full max-w-96 flex-col gap-4">
      {/* overflow: hidden and a transform, like a card that lifts on hover: a fixed child is caught inside */}
      <div className="h-32 overflow-hidden rounded-xl bg-surface-1 p-4 shadow-raised [transform:translateZ(0)]">
        <span className="block text-label-md font-medium text-fg-1">«Орбита Лаб»</span>
        <span className="block text-body-xs text-fg-3 tabular-nums">126 500 ₽ · счёт выставлен</span>
        <Button variant="secondary" size="sm" leadingIcon={<StickyNote />} className="mt-4" onClick={() => setOpen(true)}>
          Заметка
        </Button>
        {portal ? <Portal layer="dropdown">{note}</Portal> : note}
      </div>
      <Switch checked={portal} onCheckedChange={setPortal}>
        Через Portal
      </Switch>
    </div>
  );
}
