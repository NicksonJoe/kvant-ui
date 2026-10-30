import { Download, FileSpreadsheet, FileText, Link, PencilLine, Trash2 } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, MenuItem, MenuSeparator, toast } from '@/kvant';

const files = [
  { name: 'Бриф_Норда_ребрендинг.pdf', meta: '8,4 МБ · 28.10', icon: <FileText aria-hidden /> },
  { name: 'КП_Орбита_Лаб_v2.pdf', meta: '1,9 МБ · 27.10', icon: <FileText aria-hidden /> },
  { name: 'Смета_октябрь.xlsx', meta: '46 КБ · 24.10', icon: <FileSpreadsheet aria-hidden /> },
];

export default function ContextMenuFiles() {
  return (
    <ul className="flex w-80 flex-col rounded-xl bg-surface-1 p-1 shadow-raised">
      {files.map((file) => (
        <li key={file.name}>
          <ContextMenu>
            <ContextMenuTrigger
              tabIndex={0}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-fill-1 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:stroke-[1.5] [&>svg]:text-fg-3"
            >
              {file.icon}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-label-md font-medium">{file.name}</span>
                <span className="text-caption text-fg-3 tabular-nums">{file.meta}</span>
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <MenuItem icon={<Download />}>Скачать</MenuItem>
              <MenuItem icon={<PencilLine />} shortcut="F2">
                Переименовать
              </MenuItem>
              <MenuItem icon={<Link />} onClick={() => toast.add({ title: 'Ссылка на файл скопирована' })}>
                Скопировать ссылку
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Trash2 />} destructive>
                Удалить файл
              </MenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </li>
      ))}
    </ul>
  );
}
