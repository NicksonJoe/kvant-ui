import { Archive, Copy, Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, IconButton, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Popconfirm, toast } from '@/kvant';

type Pending = 'archive' | 'delete' | null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PopconfirmRowActions() {
  const more = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [gone, setGone] = useState(false);

  // archive and delete always leave 7 s to take it back
  const undoable = (title: string) => {
    const id = toast.add({
      title,
      timeout: 7000,
      actionProps: {
        children: 'Отменить',
        onClick: () => {
          toast.close(id);
          setGone(false);
        },
      },
    });
  };

  const confirm = async () => {
    await wait(600);
    setGone(true);
    undoable(pending === 'delete' ? 'Сделка удалена' : 'Сделка в архиве');
  };

  if (gone) {
    return (
      <Button variant="ghost" onClick={() => setGone(false)}>
        Вернуть строку
      </Button>
    );
  }

  return (
    <div className="flex h-control-xl w-90 max-w-full items-center gap-3 rounded-md bg-surface-1 pr-3 pl-4 shadow-[0_0_0_1px_var(--color-hairline)]">
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-fg-1">Сайт для «Орбита Лаб»</span>
      <span className="text-body-sm text-fg-2 tabular-nums">1 280 000 ₽</span>
      <Menu>
        <MenuTrigger ref={more} render={<IconButton variant="secondary" size="sm" aria-label="Ещё" icon={<MoreHorizontal aria-hidden />} />} />
        <MenuContent align="end">
          <MenuItem icon={<Pencil aria-hidden />}>Переименовать</MenuItem>
          <MenuItem icon={<Copy aria-hidden />}>Дублировать</MenuItem>
          <MenuItem icon={<Link2 aria-hidden />}>Скопировать ссылку</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Archive aria-hidden />} onClick={() => setPending('archive')}>
            В архив…
          </MenuItem>
          <MenuItem icon={<Trash2 aria-hidden />} destructive onClick={() => setPending('delete')}>
            Удалить…
          </MenuItem>
        </MenuContent>
      </Menu>
      <Popconfirm
        anchor={more}
        align="end"
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        tone={pending === 'delete' ? 'danger' : 'neutral'}
        title={pending === 'delete' ? 'Удалить сделку?' : 'Перенести сделку в архив?'}
        description={
          pending === 'delete'
            ? 'Исчезнут переписка, счета и файлы. Отменить можно в течение 7 секунд.'
            : '«Сайт для Орбита Лаб» пропадёт из воронки. Вернуть можно из раздела «Архив».'
        }
        confirmLabel={pending === 'delete' ? 'Удалить' : 'В архив'}
        onConfirm={confirm}
      />
    </div>
  );
}
