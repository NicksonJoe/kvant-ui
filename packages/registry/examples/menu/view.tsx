import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/kvant';

export default function MenuView() {
  const [showArchived, setShowArchived] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);
  const [sort, setSort] = useState('due');

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" leadingIcon={<SlidersHorizontal />} />}>Вид</MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Показывать</MenuGroupLabel>
          <MenuCheckboxItem checked={showAmounts} onCheckedChange={setShowAmounts}>
            Суммы сделок
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
            Архивные
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Сортировать</MenuGroupLabel>
          <MenuRadioGroup value={sort} onValueChange={setSort}>
            <MenuRadioItem value="due">По сроку</MenuRadioItem>
            <MenuRadioItem value="amount">По сумме</MenuRadioItem>
            <MenuRadioItem value="client">По клиенту</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
