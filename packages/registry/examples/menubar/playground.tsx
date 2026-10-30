import { Menu, MenuContent, MenuItem, MenuSeparator, Menubar, MenubarTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Menubar modal={p.bool('modal')} disabled={p.bool('disabled')} loopFocus={p.bool('loopFocus')}>
      <Menu>
        <MenubarTrigger>Файл</MenubarTrigger>
        <MenuContent>
          <MenuItem shortcut="⌘N">Новый документ</MenuItem>
          <MenuItem shortcut="⌘O">Открыть…</MenuItem>
          <MenuSeparator />
          <MenuItem shortcut="⌘W">Закрыть</MenuItem>
        </MenuContent>
      </Menu>
      <Menu>
        <MenubarTrigger>Правка</MenubarTrigger>
        <MenuContent>
          <MenuItem shortcut="⌘Z">Отменить ввод</MenuItem>
          <MenuItem shortcut="⌘C">Копировать</MenuItem>
          <MenuItem shortcut="⌘V">Вставить</MenuItem>
        </MenuContent>
      </Menu>
      <Menu>
        <MenubarTrigger>Вид</MenubarTrigger>
        <MenuContent>
          <MenuItem shortcut="⌘+">Увеличить</MenuItem>
          <MenuItem shortcut="⌘−">Уменьшить</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>
  ),
  code: (p) => `<Menubar${p.attrs(['modal', 'disabled', 'loopFocus'])}>
  <Menu>
    <MenubarTrigger>Файл</MenubarTrigger>
    <MenuContent>
      <MenuItem shortcut="⌘N">Новый документ</MenuItem>
      <MenuItem shortcut="⌘O">Открыть…</MenuItem>
      <MenuSeparator />
      <MenuItem shortcut="⌘W">Закрыть</MenuItem>
    </MenuContent>
  </Menu>
  <Menu>
    <MenubarTrigger>Правка</MenubarTrigger>
    <MenuContent>…</MenuContent>
  </Menu>
</Menubar>`,
};

export default playground;
