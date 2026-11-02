import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetTrigger, Button } from '@/kvant';

export default function ActionSheetSimple() {
  return (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="ghost" />}>Сменить фото</ActionSheetTrigger>
      <ActionSheetContent title="Фото профиля">
        <ActionSheetGroup>
          <ActionSheetItem>Снять фото</ActionSheetItem>
          <ActionSheetItem>Выбрать из галереи</ActionSheetItem>
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  );
}
