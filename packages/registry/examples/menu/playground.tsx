import { ChevronDown, Copy, Pencil, Trash2 } from 'lucide-react';
import { Button, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" trailingIcon={<ChevronDown />} />}>Действия</MenuTrigger>
      <MenuContent side={p.pick('side', ['top', 'bottom', 'left', 'right'] as const)} align={p.pick('align', ['start', 'center', 'end'] as const)}>
        <MenuItem icon={<Pencil />} shortcut="⌘E">
          Изменить
        </MenuItem>
        <MenuItem icon={<Copy />} shortcut="⌘D">
          Дублировать
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} destructive>
          Удалить
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
  code: (p) => `<Menu>
  <MenuTrigger render={<Button variant="secondary" trailingIcon={<ChevronDown />} />}>Действия</MenuTrigger>
  <MenuContent${p.attrs(['side', 'align'])}>
    <MenuItem icon={<Pencil />} shortcut="⌘E">Изменить</MenuItem>
    <MenuItem icon={<Copy />} shortcut="⌘D">Дублировать</MenuItem>
    <MenuSeparator />
    <MenuItem icon={<Trash2 />} destructive>Удалить</MenuItem>
  </MenuContent>
</Menu>`,
};

export default playground;
