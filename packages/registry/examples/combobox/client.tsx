import { Combobox, Field } from '@/kvant';

const clients = [
  { value: 'bread', label: 'Пекарня «Хлебница»' },
  { value: 'sail', label: 'Яхт-клуб «Парус»' },
  { value: 'leaf', label: 'Чайная «Листва»' },
  { value: 'oka', label: 'Фитнес-клуб «Ока»' },
  { value: 'boat', label: 'Студия «Белая лодка»' },
] as const;

export default function ComboboxClient() {
  return (
    <Field label="Клиент" className="w-80">
      <Combobox options={clients} placeholder="Начните вводить название" />
    </Field>
  );
}
