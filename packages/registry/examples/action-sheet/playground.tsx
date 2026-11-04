import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetSub, ActionSheetTrigger, Button } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'more', type: 'boolean', default: true, description: 'Пункт «Ещё» со вторым уровнем: «В архив…» и «Удалить…».' }],
  initial: { title: 'Айдентика для пекарни', cancelLabel: 'Отмена' },
  render: (p) => (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="secondary" />}>Открыть лист</ActionSheetTrigger>
      <ActionSheetContent title={p.text('title')} cancelLabel={p.text('cancelLabel')}>
        <ActionSheetGroup>
          <ActionSheetItem>Открыть сделку</ActionSheetItem>
          <ActionSheetItem>Позвонить клиенту</ActionSheetItem>
        </ActionSheetGroup>
        {p.bool('more') ? (
          <ActionSheetGroup>
            <ActionSheetSub label="Ещё" value="В архив, удалить">
              <ActionSheetGroup>
                <ActionSheetItem>В архив…</ActionSheetItem>
                <ActionSheetItem destructive>Удалить…</ActionSheetItem>
              </ActionSheetGroup>
            </ActionSheetSub>
          </ActionSheetGroup>
        ) : null}
      </ActionSheetContent>
    </ActionSheet>
  ),
  code: (p) => `<ActionSheet>
  <ActionSheetTrigger render={<Button variant="secondary" />}>Открыть лист</ActionSheetTrigger>
  <ActionSheetContent${p.attrs(['title', 'cancelLabel'])}>
    <ActionSheetGroup>
      <ActionSheetItem>Открыть сделку</ActionSheetItem>
      <ActionSheetItem>Позвонить клиенту</ActionSheetItem>
    </ActionSheetGroup>${
      p.bool('more')
        ? `
    <ActionSheetGroup>
      <ActionSheetSub label="Ещё" value="В архив, удалить">
        <ActionSheetGroup>
          <ActionSheetItem>В архив…</ActionSheetItem>
          <ActionSheetItem destructive>Удалить…</ActionSheetItem>
        </ActionSheetGroup>
      </ActionSheetSub>
    </ActionSheetGroup>`
        : ''
    }
  </ActionSheetContent>
</ActionSheet>`,
};

export default playground;
