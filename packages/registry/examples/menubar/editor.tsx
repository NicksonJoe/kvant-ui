import { Menu, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, Menubar, MenubarTrigger } from '@/kvant';

export default function MenubarEditor() {
  return (
    <div className="w-full max-w-160 overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
      <div className="flex items-center border-b border-separator py-2 pr-4 pl-2">
        <Menubar>
          <Menu>
            <MenubarTrigger>Файл</MenubarTrigger>
            <MenuContent>
              <MenuItem shortcut="⌘N">Новый документ</MenuItem>
              <MenuItem shortcut="⌘O">Открыть…</MenuItem>
              <MenuItem shortcut="⇧⌘S">Сохранить копию</MenuItem>
              <MenuSeparator />
              <MenuItem>Экспорт в PDF</MenuItem>
              <MenuSeparator />
              <MenuItem shortcut="⌘W">Закрыть</MenuItem>
            </MenuContent>
          </Menu>
          <Menu>
            <MenubarTrigger>Правка</MenubarTrigger>
            <MenuContent>
              <MenuItem shortcut="⌘Z">Отменить ввод</MenuItem>
              <MenuItem shortcut="⇧⌘Z" disabled>
                Повторить
              </MenuItem>
              <MenuSeparator />
              <MenuItem shortcut="⌘X">Вырезать</MenuItem>
              <MenuItem shortcut="⌘C">Копировать</MenuItem>
              <MenuItem shortcut="⌘V">Вставить</MenuItem>
              <MenuItem shortcut="⌥⇧⌘V">Вставить без оформления</MenuItem>
              <MenuSeparator />
              <MenuItem shortcut="⌘A">Выделить всё</MenuItem>
              <MenuSeparator />
              <MenuSub>
                <MenuSubTrigger>Найти и заменить</MenuSubTrigger>
                <MenuSubContent>
                  <MenuItem shortcut="⌘F">Найти</MenuItem>
                  <MenuItem shortcut="⌥⌘F">Заменить</MenuItem>
                </MenuSubContent>
              </MenuSub>
            </MenuContent>
          </Menu>
          <Menu>
            <MenubarTrigger>Вид</MenubarTrigger>
            <MenuContent>
              <MenuItem shortcut="⌘+">Увеличить</MenuItem>
              <MenuItem shortcut="⌘−">Уменьшить</MenuItem>
              <MenuItem shortcut="⌘0">Реальный размер</MenuItem>
            </MenuContent>
          </Menu>
          <Menu>
            <MenubarTrigger>Окно</MenubarTrigger>
            <MenuContent>
              <MenuItem shortcut="⌘M">Свернуть</MenuItem>
              <MenuItem shortcut="⌃⌘F">На весь экран</MenuItem>
            </MenuContent>
          </Menu>
        </Menubar>
        <span className="ml-auto text-caption text-fg-3 tabular-nums">Сохранено в 14:32</span>
      </div>
      <div className="flex flex-col gap-2 px-8 py-6">
        <h3 className="text-heading-md font-semibold">Коммерческое предложение для «Орбита Лаб»</h3>
        <p className="max-w-[60ch] text-body-sm text-fg-2">
          Предлагаем провести ребрендинг в три этапа: аудит текущего стиля, концепция и внедрение на всех носителях.
          Срок — 9 недель с даты подписания, стоимость — 1 284 900 ₽ с НДС.
        </p>
      </div>
    </div>
  );
}
