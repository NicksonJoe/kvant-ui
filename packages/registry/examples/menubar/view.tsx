import { useState } from 'react';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  Menubar,
  MenubarTrigger,
} from '@/kvant';

export default function MenubarView() {
  const [ruler, setRuler] = useState(true);
  const [numbers, setNumbers] = useState(false);
  const [zoom, setZoom] = useState('100');

  return (
    <Menubar>
      <Menu>
        <MenubarTrigger>Вид</MenubarTrigger>
        <MenuContent>
          <MenuCheckboxItem checked={ruler} onCheckedChange={setRuler}>
            Линейка
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={numbers} onCheckedChange={setNumbers}>
            Номера страниц
          </MenuCheckboxItem>
          <MenuSeparator />
          <MenuGroup>
            <MenuGroupLabel>Масштаб</MenuGroupLabel>
            <MenuRadioGroup value={zoom} onValueChange={setZoom}>
              <MenuRadioItem value="75">75 %</MenuRadioItem>
              <MenuRadioItem value="100">100 %</MenuRadioItem>
              <MenuRadioItem value="150">150 %</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
      <Menu>
        <MenubarTrigger>Формат</MenubarTrigger>
        <MenuContent>
          <MenuCheckboxItem defaultChecked>Перенос слов</MenuCheckboxItem>
          <MenuCheckboxItem>Висячая пунктуация</MenuCheckboxItem>
        </MenuContent>
      </Menu>
      <Menu disabled>
        <MenubarTrigger>Справка</MenubarTrigger>
        <MenuContent>
          <MenuCheckboxItem>Подсказки</MenuCheckboxItem>
        </MenuContent>
      </Menu>
    </Menubar>
  );
}
