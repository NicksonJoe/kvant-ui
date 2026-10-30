import { NativeSelect } from '@/kvant';

const sizes = [
  ['sm', 'Маленький список'],
  ['md', 'Средний список'],
  ['lg', 'Большой список для касания'],
] as const;

export default function NativeSelectSizes() {
  return (
    <div className="flex w-72 max-w-full flex-col gap-3">
      {sizes.map(([size, label]) => (
        <NativeSelect key={size} size={size} aria-label={label} defaultValue="rub">
          <option value="rub">Россия, рубль</option>
          <option value="kzt">Казахстан, тенге</option>
        </NativeSelect>
      ))}
    </div>
  );
}
