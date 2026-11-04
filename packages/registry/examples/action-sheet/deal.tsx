import { Archive, ArrowUpRight, Ellipsis, Flag, Phone, Share, Trash2 } from 'lucide-react';
import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetSub, ActionSheetTrigger, Button } from '@/kvant';

export default function ActionSheetDeal() {
  return (
    <ActionSheet>
      <ActionSheetTrigger render={<Button variant="secondary" />}>Действия со сделкой</ActionSheetTrigger>
      <ActionSheetContent title="Айдентика для пекарни" description="«Хлебница» · 1 284 900 ₽ · Переговоры">
        <ActionSheetGroup>
          <ActionSheetItem icon={<ArrowUpRight aria-hidden />}>Открыть сделку</ActionSheetItem>
          <ActionSheetItem icon={<Flag aria-hidden />} value="Переговоры" keepOpen>
            Изменить этап
          </ActionSheetItem>
          <ActionSheetItem icon={<Phone aria-hidden />}>Позвонить Ольге</ActionSheetItem>
          <ActionSheetItem icon={<Share aria-hidden />}>Поделиться ссылкой</ActionSheetItem>
        </ActionSheetGroup>
        <ActionSheetGroup>
          <ActionSheetSub label="Ещё" icon={<Ellipsis aria-hidden />} value="В архив, удалить">
            <ActionSheetGroup>
              <ActionSheetItem icon={<Archive aria-hidden />}>В архив…</ActionSheetItem>
              <ActionSheetItem icon={<Trash2 aria-hidden />} destructive>
                Удалить…
              </ActionSheetItem>
            </ActionSheetGroup>
          </ActionSheetSub>
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  );
}
