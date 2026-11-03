import { Field, MonthPicker } from '@/kvant';

export default function MonthPickerYear() {
  return (
    <Field label="Год выпуска" className="w-80 max-w-full">
      <MonthPicker granularity="year" defaultValue={new Date(2024, 0, 1)} min={new Date(1990, 0, 1)} max={new Date()} />
    </Field>
  );
}
