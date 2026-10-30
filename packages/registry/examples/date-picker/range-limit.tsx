import { DatePicker, Field } from '@/kvant';

const today = new Date();
const inTwoMonths = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

export default function DatePickerRangeLimit() {
  return (
    <Field label="Дата съёмки" className="w-72">
      <DatePicker min={today} max={inTwoMonths} />
    </Field>
  );
}
