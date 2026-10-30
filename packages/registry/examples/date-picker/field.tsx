import { DatePicker, Field } from '@/kvant';

export default function DatePickerField() {
  return (
    <Field label="Срок сдачи" description="Клиент получит напоминание за день" className="w-72">
      <DatePicker defaultValue={new Date(2026, 10, 12)} />
    </Field>
  );
}
