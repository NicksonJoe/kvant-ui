import { Bell } from 'lucide-react';
import { CanvasInsertMenu } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { STEP_GROUPS } from '../step-palette/data';

const playground: Playground = {
  initial: { context: 'после «Создать сделку»' },
  render: (p) => (
    <CanvasInsertMenu
      context={p.text('context') || undefined}
      groups={STEP_GROUPS}
      suggestions={[{ template: { id: 'notify-manager', kind: 'action', title: 'Уведомить менеджера', icon: <Bell /> }, reason: 'чаще всего ставят после создания сделки' }]}
      templates={[{ id: 'notify-and-wait', kind: 'group', title: 'Уведомить и ждать ответа · 3 шага' }]}
      onInsert={() => undefined}
      onClose={() => undefined}
    />
  ),
  code: (p) =>
    `<CanvasInsertMenu${p.attrs(['context'])} groups={groups} suggestions={suggestions} templates={templates} onInsert={(step, { open }) => insert(step, open)} onClose={close} />`,
};

export default playground;
