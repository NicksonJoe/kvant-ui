import { useState } from 'react';
import { CanvasHistoryPanel, type CanvasHistoryEntry } from '@/kvant';

const ENTRIES: readonly CanvasHistoryEntry[] = [
  { id: 'h4', title: 'Подключила «Есть бюджет?»', author: 'Анна', time: 'только что' },
  { id: 'h3', title: 'Изменил инструкцию агента', author: 'Вы', time: '4 мин назад' },
  { id: 'h2', title: 'Разложил граф · 6 шагов', author: 'Вы', time: '12 мин назад' },
  { id: 'h1', title: 'Агент Норды собрал черновик', author: 'Норда', time: '20 мин назад' },
];

export default function CanvasHistoryExample() {
  const [entries, setEntries] = useState(ENTRIES);
  const [current, setCurrent] = useState('h4');
  return (
    <div className="flex w-full justify-center rounded-xl bg-surface-2 p-8">
      <CanvasHistoryPanel
        entries={entries}
        currentId={current}
        period="сегодня"
        onRestore={(entry) => {
          // the rollback is itself a step of the history
          const id = `r${entries.length + 1}`;
          setEntries([{ id, title: `Вернул к «${entry.title}»`, author: 'Вы', time: 'только что' }, ...entries]);
          setCurrent(id);
        }}
      />
    </div>
  );
}
