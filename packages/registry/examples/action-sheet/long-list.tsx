import { UserRound } from 'lucide-react';
import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetTrigger, Button } from '@/kvant';

const managers = [
  'Анна Северова',
  'Пётр Савин',
  'Ольга Миронова',
  'Игорь Лебедев',
  'Дарья Ким',
  'Максим Орлов',
  'Анна Ковалёва',
  'Сергей Белов',
  'Елена Гусева',
  'Тимур Алиев',
  'Вера Никитина',
  'Роман Зайцев',
];

export default function ActionSheetLongList() {
  return (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="secondary" />}>Передать сделку</ActionSheetTrigger>
      <ActionSheetContent title="Передать сделку" description="Айдентика для пекарни · 12 сотрудников">
        <ActionSheetGroup>
          {managers.map((name) => (
            <ActionSheetItem key={name} icon={<UserRound aria-hidden />}>
              {name}
            </ActionSheetItem>
          ))}
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  );
}
