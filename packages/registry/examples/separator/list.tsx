import { Separator } from '@/kvant';

const rows = [
  ['Тариф', 'Студия'],
  ['Мест в команде', '8 из 10'],
  ['Следующий платёж', '12 ноября'],
];

export default function SeparatorList() {
  return (
    <div className="flex w-80 flex-col gap-3">
      {rows.map(([label, value], index) => (
        <div key={label} className="flex flex-col gap-3">
          {index > 0 ? <Separator /> : null}
          <div className="flex justify-between text-body-sm">
            <span className="text-fg-2">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
