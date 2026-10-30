import { Archive, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, MenuItem, MenuSeparator } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [
    { name: 'destructive', type: 'boolean', default: true, description: 'Опасный пункт последним, после разделителя.' },
    { name: 'shortcuts', type: 'boolean', default: true, description: 'Сочетания клавиш справа.' },
  ],
  render: (p) => (
    <ContextMenu>
      <ContextMenuTrigger
        tabIndex={0}
        className="grid h-28 w-64 place-items-center rounded-xl border border-dashed border-border text-body-sm text-fg-3"
      >
        Правый клик здесь
      </ContextMenuTrigger>
      <ContextMenuContent>
        <MenuItem icon={<ExternalLink />}>Открыть в новой вкладке</MenuItem>
        <MenuItem icon={<Copy />} shortcut={p.bool('shortcuts') ? '⇧⌘C' : undefined}>
          Скопировать ссылку
        </MenuItem>
        <MenuItem icon={<Archive />}>Перенести в архив</MenuItem>
        {p.bool('destructive') ? (
          <>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} shortcut={p.bool('shortcuts') ? '⌘⌫' : undefined} destructive>
              Удалить сделку
            </MenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  ),
  code: (p) => {
    const copy = p.bool('shortcuts') ? ' shortcut="⇧⌘C"' : '';
    const remove = p.bool('destructive')
      ? `\n    <MenuSeparator />\n    <MenuItem icon={<Trash2 />}${p.bool('shortcuts') ? ' shortcut="⌘⌫"' : ''} destructive>Удалить сделку</MenuItem>`
      : '';
    return `<ContextMenu>
  <ContextMenuTrigger tabIndex={0}>Правый клик здесь</ContextMenuTrigger>
  <ContextMenuContent>
    <MenuItem icon={<ExternalLink />}>Открыть в новой вкладке</MenuItem>
    <MenuItem icon={<Copy />}${copy}>Скопировать ссылку</MenuItem>
    <MenuItem icon={<Archive />}>Перенести в архив</MenuItem>${remove}
  </ContextMenuContent>
</ContextMenu>`;
  },
};

export default playground;
