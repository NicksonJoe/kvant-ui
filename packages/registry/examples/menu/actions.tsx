import { ChevronDown, Copy, Folder, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  toast,
} from '@/kvant';

export default function MenuActions() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" trailingIcon={<ChevronDown />} />}>Действия</MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} shortcut="⌘E">
          Изменить
        </MenuItem>
        <MenuItem icon={<Copy />} shortcut="⌘D" onClick={() => toast.add({ title: 'Сделка скопирована' })}>
          Дублировать
        </MenuItem>
        <MenuSub>
          <MenuSubTrigger icon={<Folder />}>Переместить</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Воронка «Продажи»</MenuItem>
            <MenuItem>Воронка «Партнёры»</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} destructive>
          Удалить
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
