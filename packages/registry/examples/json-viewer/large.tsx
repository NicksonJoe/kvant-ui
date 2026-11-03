import { useMemo, useState } from 'react';
import { Button, JsonViewer } from '@/kvant';

const STAGES = ['qualification', 'negotiation', 'proposal', 'contract', 'invoice'];
const PEOPLE = ['Илья Громов', 'Анна Северова', 'Вера Лебедева', 'Пётр Ильин'];

/** 2,9 МБ export of 12 000 events: the top level first, the open array scrolls as a virtual list. */
export default function Large() {
  const [shown, setShown] = useState(false);
  const text = useMemo(
    () =>
      shown
        ? JSON.stringify({
            export: { from: '2026-01-01', to: '2026-11-04', format: 'kvant/1' },
            events: Array.from({ length: 12_000 }, (_, index) => ({
              id: 100_000 + index,
              deal: 1000 + (index % 640),
              stage: STAGES[index % STAGES.length],
              by: PEOPLE[index % PEOPLE.length],
              amount: 40_000 + ((index * 7_919) % 900) * 1_000,
              note: 'Перевод по воронке после звонка и согласования сметы с клиентом',
              at: new Date(Date.UTC(2026, 0, 1) + index * 2_400_000).toISOString(),
            })),
          })
        : '',
    [shown],
  );
  if (!shown) {
    return (
      <Button variant="secondary" onClick={() => setShown(true)}>
        Открыть выгрузку 12 000 событий
      </Button>
    );
  }
  return <JsonViewer className="w-full max-w-190" title="export · events.json" value={text} height={420} />;
}
