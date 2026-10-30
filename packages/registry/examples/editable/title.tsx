import { useState } from 'react';
import { Badge, Editable } from '@/kvant';

export default function EditableTitle() {
  const [title, setTitle] = useState('Ребрендинг «Студии Север»');
  return (
    <div className="flex w-full max-w-104 flex-col gap-2 rounded-xl bg-surface-1 p-5 shadow-raised">
      <h3 className="-ml-3 text-heading-xs font-semibold text-fg-1">
        <Editable aria-label="Название проекта" value={title} onValueCommit={setTitle} savedMessage="Сохранено · видно всей команде" />
      </h3>
      <div className="flex items-center gap-2 text-body-sm text-fg-3">
        <Badge tone="accent">В работе</Badge>
        Сдача 22 декабря
      </div>
    </div>
  );
}
