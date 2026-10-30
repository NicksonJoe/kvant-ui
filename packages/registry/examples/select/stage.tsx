import { Field, Select } from '@/kvant';

const stages = [
  { value: 'qualification', label: 'Квалификация' },
  { value: 'brief', label: 'Бриф' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'contract', label: 'Договор' },
  { value: 'invoice', label: 'Счёт выставлен' },
] as const;

export default function SelectStage() {
  return (
    <Field label="Этап" className="w-72">
      <Select options={stages} defaultValue="negotiation" />
    </Field>
  );
}
