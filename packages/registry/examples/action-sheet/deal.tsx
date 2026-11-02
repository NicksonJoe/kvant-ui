import { Archive, CalendarPlus, Phone, Trash2 } from 'lucide-react';
import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetTrigger, Button } from '@/kvant';

export default function ActionSheetDeal() {
  return (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="secondary" />}>Действия со сделкой</ActionSheetTrigger>
      <ActionSheetContent title="Айдентика для пекарни" description="«Хлебная лавка» · 1 284 900 ₽">
        <ActionSheetGroup>
          <ActionSheetItem icon={<CalendarPlus aria-hidden />}>Создать задачу</ActionSheetItem>
          <ActionSheetItem icon={<Phone aria-hidden />}>Позвонить клиенту</ActionSheetItem>
        </ActionSheetGroup>
        <ActionSheetGroup>
          <ActionSheetItem icon={<Archive aria-hidden />}>В архив…</ActionSheetItem>
          <ActionSheetItem icon={<Trash2 aria-hidden />} destructive>
            Удалить…
          </ActionSheetItem>
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  );
}
