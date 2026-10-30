import { ColorSwatches } from '@/kvant';

export default function ColorPickerSwatches() {
  return (
    <ColorSwatches
      aria-label="Цвет проекта"
      colors={['#3986E4', '#C2612C', '#2A9D8F', '#A38A1B', '#C2509A', '#4E9A3C', '#8B63D9', '#D2544B']}
      defaultValue="#2A9D8F"
    />
  );
}
