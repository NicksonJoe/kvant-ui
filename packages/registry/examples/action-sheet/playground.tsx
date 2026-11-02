import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetTrigger, Button } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Айдентика для пекарни', cancelLabel: 'Отмена' },
  render: (p) => (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="secondary" />}>Открыть лист</ActionSheetTrigger>
      <ActionSheetContent title={p.text('title')} cancelLabel={p.text('cancelLabel')}>
        <ActionSheetGroup>
          <ActionSheetItem>Создать задачу</ActionSheetItem>
          <ActionSheetItem destructive>Удалить…</ActionSheetItem>
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  ),
  code: (p) => `<ActionSheet>
  <ActionSheetTrigger render={<Button variant="secondary" />}>Открыть лист</ActionSheetTrigger>
  <ActionSheetContent${p.attrs(['title', 'cancelLabel'])}>
    <ActionSheetGroup>
      <ActionSheetItem>Создать задачу</ActionSheetItem>
      <ActionSheetItem destructive>Удалить…</ActionSheetItem>
    </ActionSheetGroup>
  </ActionSheetContent>
</ActionSheet>`,
};

export default playground;
