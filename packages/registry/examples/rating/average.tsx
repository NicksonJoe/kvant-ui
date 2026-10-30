import { Rating } from '@/kvant';

export default function RatingAverage() {
  return (
    <div className="flex items-center gap-2.5">
      <Rating readOnly value={3.5} aria-label="Средняя оценка" />
      <span className="text-label-md font-semibold tabular-nums">3,5</span>
      <span className="text-label-sm text-fg-3">из 5 · 42 оценки</span>
    </div>
  );
}
