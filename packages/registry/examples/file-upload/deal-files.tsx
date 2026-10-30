import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, UploadItem, UploadList, formatFileSize, type UploadItemProps } from '@/kvant';

type Row = Pick<UploadItemProps, 'name' | 'size' | 'status' | 'progress' | 'meta' | 'error'>;

const plural = new Intl.PluralRules('ru');
const filesWord = (n: number) => {
  const rule = plural.select(n);
  return rule === 'one' ? 'файл' : rule === 'few' ? 'файла' : 'файлов';
};

const initial: Row[] = [
  { name: 'Договор_48-26.docx', size: 1_258_291, status: 'queued' },
  { name: 'Бриф_Норда_ребрендинг.pdf', size: 8_808_038, status: 'uploading', progress: 37, meta: 'осталось 12 с' },
  { name: 'Логотип_финал.png', size: 2_726_297, status: 'done', meta: 'загружен в 14:32' },
  { name: 'Смета_октябрь.xlsx', size: 431_002, status: 'error', error: 'Связь прервалась на 64 % — файл не сохранён' },
];

export default function FileUploadDealFiles() {
  const [rows, setRows] = useState(initial);
  const total = rows.reduce((sum, row) => sum + row.size, 0);
  const remove = (name: string) => setRows((list) => list.filter((row) => row.name !== name));
  const retry = (name: string) =>
    setRows((list) => list.map((row) => (row.name === name ? { ...row, status: 'uploading', progress: 0, error: undefined, meta: undefined } : row)));

  return (
    <section className="flex w-156 max-w-full flex-col rounded-xl bg-surface-1 pb-1 shadow-raised">
      <header className="flex items-center gap-3 pt-4 pr-3 pb-3 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-heading-xs font-semibold">Файлы сделки</h3>
          <p className="text-body-xs text-fg-3 tabular-nums">
            {`${rows.length}\u00a0${filesWord(rows.length)} · ${formatFileSize(total)} из 100\u00a0МБ`}
          </p>
        </div>
        <Button variant="ghost" size="sm" leadingIcon={<Plus aria-hidden />}>
          Добавить
        </Button>
      </header>
      <UploadList>
        {rows.map((row) => (
          <UploadItem key={row.name} {...row} onRemove={() => remove(row.name)} onRetry={() => retry(row.name)} />
        ))}
      </UploadList>
    </section>
  );
}
