import { ChevronDown } from 'lucide-react';
import { ButtonGroup, ButtonGroupItem, Menu, MenuContent, MenuItem, MenuTrigger, toast } from '@/kvant';

export default function ButtonGroupSplit() {
  return (
    <ButtonGroup variant="primary" aria-label="Сохранение">
      <ButtonGroupItem onClick={() => toast.add({ title: 'Сделка сохранена', type: 'success' })}>Сохранить</ButtonGroupItem>
      <Menu>
        <MenuTrigger render={<ButtonGroupItem iconOnly aria-label="Другие варианты сохранения" />}>
          <ChevronDown />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem shortcut="⌘↵">Сохранить и закрыть</MenuItem>
          <MenuItem>Сохранить как черновик</MenuItem>
          <MenuItem>Сохранить как шаблон</MenuItem>
        </MenuContent>
      </Menu>
    </ButtonGroup>
  );
}
