import { useState } from 'react';
import { ColorPicker } from '@/kvant';

export default function ColorPickerLabel() {
  const [palette, setPalette] = useState(['#3986E4', '#C2612C', '#2A9D8F', '#A38A1B', '#C2509A', '#4E9A3C', '#8B63D9']);
  const [color, setColor] = useState('#3986E4');
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Цвет метки</span>
      <ColorPicker
        aria-label="Цвет метки"
        value={color}
        onValueChange={setColor}
        swatches={palette}
        onAddSwatch={(next) => setPalette((list) => (list.includes(next) ? list : [...list, next]))}
        className="w-55"
      />
    </div>
  );
}
