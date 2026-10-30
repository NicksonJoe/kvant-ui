import { Archive, ArrowRight, Copy, ExternalLink, Pin, Trash2, UserRound } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  toast,
} from '@/kvant';

const deals = [
  { title: 'Сайт для «Студии Север»', client: '«Студия Север» · до 14 ноября', amount: '860 000 ₽' },
  { title: 'Ребрендинг «Орбита Лаб»', client: '«Орбита Лаб» · до 2 декабря', amount: '1 284 900 ₽' },
  { title: 'Годовое сопровождение', client: 'Кофейня «Зерно» · до 20 ноября', amount: '795 100 ₽' },
];

export default function ContextMenuKanban() {
  return (
    <div className="flex w-72 flex-col gap-2 rounded-xl bg-surface-2 p-2">
      <div className="flex items-center justify-between px-2 pt-1 text-label-sm font-medium">
        <span>Переговоры</span>
        <span className="text-fg-3 tabular-nums">2 940 000 ₽</span>
      </div>
      {deals.map((deal) => (
        <ContextMenu key={deal.title}>
          {/* Focusable, so Shift+F10 and the Menu key open the same menu from the keyboard. */}
          <ContextMenuTrigger tabIndex={0} className="flex flex-col gap-2 rounded-md bg-surface-1 p-3 shadow-raised">
            <span className="flex flex-col">
              <span className="text-label-md font-medium">{deal.title}</span>
              <span className="text-caption text-fg-3">{deal.client}</span>
            </span>
            <span className="text-label-md font-semibold tabular-nums">{deal.amount}</span>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <MenuItem icon={<ExternalLink />}>Открыть в новой вкладке</MenuItem>
            <MenuSub>
              <MenuSubTrigger icon={<UserRound />}>Назначить ответственного</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem>Анна Северова</MenuItem>
                <MenuItem>Марк Ковалёв</MenuItem>
                <MenuItem>Илья Воронов</MenuItem>
              </MenuSubContent>
            </MenuSub>
            <MenuSub>
              <MenuSubTrigger icon={<ArrowRight />}>Сменить этап</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem>Предложение</MenuItem>
                <MenuItem>Договор</MenuItem>
              </MenuSubContent>
            </MenuSub>
            <MenuSeparator />
            <MenuItem icon={<Copy />} shortcut="⇧⌘C" onClick={() => toast.add({ title: 'Ссылка скопирована' })}>
              Скопировать ссылку
            </MenuItem>
            <MenuItem icon={<Pin />}>Закрепить в колонке</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Archive />}>Перенести в архив</MenuItem>
            <MenuItem icon={<Trash2 />} shortcut="⌘⌫" destructive>
              Удалить сделку
            </MenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
