import { Timer } from '@/kvant';

const MINUTE = 60_000;

const cells = [
  { label: 'обратный отсчёт', timer: <Timer variant="inline" value={2 * 60 * MINUTE + 14 * MINUTE + 37_000} aria-label="До ответа" /> },
  { label: 'меньше 15 минут', timer: <Timer variant="inline" value={12 * MINUTE + 5_000} aria-label="До ответа" /> },
  { label: 'просрочено', timer: <Timer variant="inline" value={-(3 * MINUTE + 41_000)} aria-label="Ответ клиенту" /> },
  { label: 'секундомер · идёт', timer: <Timer variant="inline" mode="stopwatch" value={47 * MINUTE + 18_000} aria-label="Учёт времени" /> },
  { label: 'на паузе', timer: <Timer variant="inline" mode="stopwatch" paused value={47 * MINUTE + 18_000} aria-label="Учёт времени" /> },
];

export default function TimerInline() {
  return (
    <div className="flex flex-wrap gap-y-6">
      {cells.map((cell) => (
        <div key={cell.label} className="flex w-45 shrink-0 flex-col gap-3">
          <span className="text-caption font-medium text-fg-3">{cell.label}</span>
          {cell.timer}
        </div>
      ))}
    </div>
  );
}
