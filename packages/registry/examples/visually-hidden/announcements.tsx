import { Check, CircleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Announce, Button } from '@/kvant';

function Column({ label, spec, note, action, children }: { label: string; spec: string; note: string; action: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-3">
      <span className="text-caption font-medium text-fg-3">{label}</span>
      <div className="flex h-control-md items-center">{children}</div>
      <div className="flex flex-col gap-1">
        <code className="font-mono text-overline font-medium text-fg-1">{spec}</code>
        <span className="text-body-sm text-fg-2">{note}</span>
      </div>
      {action}
    </div>
  );
}

const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const later = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function VisuallyHiddenAnnouncements() {
  const [savedAt, setSavedAt] = useState('14:32');
  const [saved, setSaved] = useState('');
  const [failed, setFailed] = useState('');
  const [shown, setShown] = useState(40);
  const [loaded, setLoaded] = useState('');

  const save = async () => {
    setSaved('');
    await later(600);
    setSavedAt(now());
    setSaved('Сохранено');
  };
  const saveOffline = async () => {
    setFailed('');
    await later(400);
    setFailed('Не удалось сохранить — нет сети');
  };
  const loadMore = async () => {
    setLoaded('');
    await later(300);
    setShown((count) => Math.min(count + 20, 1284));
    setLoaded('Загружено 20 клиентов');
  };

  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-8">
      <Column
        label="карточка сохранилась сама"
        spec={'role="status" · aria-live="polite"'}
        note="Диктор дочитывает фразу и говорит «Сохранено»"
        action={
          <Button variant="secondary" size="sm" onClick={save}>
            Изменить карточку
          </Button>
        }
      >
        <span key={savedAt} className="flex items-center gap-1.5 text-body-xs font-medium text-fg-2 transition-opacity duration-(--duration-quick) ease-out starting:opacity-0">
          <Check aria-hidden className="size-4 stroke-2 text-success" />
          Сохранено в {savedAt}
        </span>
        <Announce>{saved}</Announce>
      </Column>
      <Column
        label="сеть пропала при сохранении"
        spec={'role="alert" · aria-live="assertive"'}
        note="Перебивает диктора сразу — только для ошибок, которые теряют данные"
        action={
          <Button variant="secondary" size="sm" onClick={saveOffline}>
            Сохранить без сети
          </Button>
        }
      >
        <span className="flex h-control-md items-center gap-2 rounded-lg bg-danger-soft px-3 text-body-xs font-medium text-danger-soft-fg">
          <CircleAlert aria-hidden className="size-4 stroke-[1.75]" />
          Не удалось сохранить — нет сети
        </span>
        <Announce politeness="assertive">{failed}</Announce>
      </Column>
      <Column
        label="догрузилась страница списка"
        spec="Announce · polite, через 2 с не повторяет"
        note="«Загружено 20 клиентов» — регион есть в DOM заранее, пустой, меняется только текст"
        action={
          <Button variant="secondary" size="sm" onClick={loadMore}>
            Показать ещё 20
          </Button>
        }
      >
        <span className="text-body-xs font-medium text-fg-2 tabular-nums">Показано {shown.toLocaleString('ru-RU')} из 1 284</span>
        <Announce>{loaded}</Announce>
      </Column>
    </div>
  );
}
