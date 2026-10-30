import { FileSpreadsheet } from 'lucide-react';
import { useId, useState } from 'react';
import { Button, Tour } from '@/kvant';

/** One step, no «Назад» and no «Пропустить»: a single new feature right after an update. */
export default function TourWhatsNew() {
  const [open, setOpen] = useState(false);
  const scope = useId();

  return (
    <div className="flex flex-col items-start gap-4">
      <div data-tour-scope={scope} className="flex items-center gap-2">
        <Button variant="secondary">Фильтры</Button>
        <Button data-tour="export" variant="secondary" leadingIcon={<FileSpreadsheet />}>
          Выгрузить в Excel
        </Button>
      </div>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Что нового в 3.0
      </Button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          {
            target: `[data-tour-scope="${scope}"] [data-tour="export"]`,
            title: 'Выгрузка переехала сюда',
            description: 'Таблица сделок выгружается с текущими фильтрами и колонками — как на экране.',
            side: 'right',
          },
        ]}
      />
    </div>
  );
}
