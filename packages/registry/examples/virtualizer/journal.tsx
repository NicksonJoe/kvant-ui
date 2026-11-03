import { RelativeTime, VirtualList } from '@/kvant';

const NOTES = [
  'Позвонили клиенту',
  'Отправили счёт № 412 на 86 000 ₽ и договор на подпись',
  'Клиент попросил перенести встречу на четверг: в среду у него выездной день, а в пятницу отпуск всего отдела. Договорились на 11:00 по Москве.',
  'Сделка перешла на этап «Переговоры»',
];
const now = Date.now();

// 5 000 entries of different lengths: each row is measured once it shows
export default function VirtualizerJournal() {
  return (
    <VirtualList
      aria-label="Журнал событий"
      className="h-[360px] w-full max-w-lg rounded-xl bg-surface-1 shadow-raised"
      count={5000}
      rowHeight={64}
      measureRows
      renderRow={(index) => (
        <div className="flex flex-col gap-1 border-b border-separator px-5 py-3">
          <RelativeTime date={new Date(now - index * 37 * 60_000)} className="text-caption text-fg-3" />
          <p className="text-body-sm text-fg-1">{NOTES[index % NOTES.length]}</p>
        </div>
      )}
    />
  );
}
