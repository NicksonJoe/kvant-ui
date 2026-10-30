import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/kvant';

const names: Record<string, string> = {
  left: 'по левому краю',
  center: 'по центру',
  right: 'по правому краю',
  justify: 'по ширине',
};

export default function ToggleGroupAlignment() {
  const [value, setValue] = useState<string[]>(['left']);
  const current = value[0];
  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleGroup value={value} onValueChange={setValue} aria-label="Выравнивание">
        <ToggleGroupItem value="left" aria-label="По левому краю">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="По центру">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="По правому краю">
          <AlignRight />
        </ToggleGroupItem>
        <ToggleGroupItem value="justify" aria-label="По ширине">
          <AlignJustify />
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-caption text-fg-3">{current ? `Выравнивание ${names[current] ?? ''}` : 'Выравнивание не задано'}</p>
    </div>
  );
}
