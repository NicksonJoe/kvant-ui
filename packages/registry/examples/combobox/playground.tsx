import { Combobox } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { placeholder: 'Начните вводить название' },
  render: (p) => (
    <Combobox
      aria-label="Клиент"
      placeholder={p.text('placeholder')}
      emptyText={p.text('emptyText')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      disabled={p.bool('disabled')}
      className="w-80 max-w-full"
      options={[
        { value: 'bread', label: 'Пекарня «Хлебница»' },
        { value: 'sail', label: 'Яхт-клуб «Парус»' },
        { value: 'leaf', label: 'Чайная «Листва»' },
      ]}
    />
  ),
  code: (p) => `<Combobox
  aria-label="Клиент"${p.attrs(['placeholder', 'emptyText', 'size', 'disabled'])}
  options={[
    { value: 'bread', label: 'Пекарня «Хлебница»' },
    { value: 'sail', label: 'Яхт-клуб «Парус»' },
    { value: 'leaf', label: 'Чайная «Листва»' },
  ]}
/>`,
};

export default playground;
