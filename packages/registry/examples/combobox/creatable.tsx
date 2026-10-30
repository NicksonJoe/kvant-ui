import { useState } from 'react';
import { Combobox, toast } from '@/kvant';

export default function ComboboxCreatable() {
  const [tags, setTags] = useState([
    { value: 'branding', label: 'Брендинг' },
    { value: 'web', label: 'Сайт' },
    { value: 'packaging', label: 'Упаковка' },
  ]);

  return (
    <Combobox
      aria-label="Направление"
      placeholder="Направление проекта"
      className="w-80"
      options={tags}
      onCreate={(label) => {
        setTags((current) => [...current, { value: label.toLowerCase(), label }]);
        toast.add({ title: `Направление «${label}» создано`, type: 'success' });
      }}
    />
  );
}
