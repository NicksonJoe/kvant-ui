import { Button, Tooltip } from '@/kvant';

const sides = [
  ['top', 'Сверху'],
  ['right', 'Справа'],
  ['bottom', 'Снизу'],
  ['left', 'Слева'],
] as const;

export default function TooltipSides() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {sides.map(([side, label]) => (
        <Tooltip key={side} side={side} content={`Подсказка ${label.toLowerCase()}`}>
          <Button variant="secondary">{label}</Button>
        </Tooltip>
      ))}
    </div>
  );
}
