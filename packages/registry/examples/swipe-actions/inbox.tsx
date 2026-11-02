import { MailOpen } from 'lucide-react';
import { useState } from 'react';
import { SwipeActions } from '@/kvant';

export default function SwipeActionsInbox() {
  const [read, setRead] = useState(false);
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-raised">
      <SwipeActions leading={[{ id: 'read', label: 'Прочитано', icon: <MailOpen aria-hidden />, onSelect: () => setRead(true) }]}>
        <div className="flex items-center gap-3 px-4 py-3">
          {read ? null : <span aria-label="не прочитано" className="size-2 rounded-full bg-accent" />}
          <span className="flex-1 text-body-sm">Марина Ким: «Пришлите, пожалуйста, акт за октябрь»</span>
        </div>
      </SwipeActions>
    </div>
  );
}
