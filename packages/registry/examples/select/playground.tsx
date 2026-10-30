import { Select } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Select
      aria-label="Этап сделки"
      placeholder={p.text('placeholder')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      disabled={p.bool('disabled')}
      required={p.bool('required')}
      className="w-72 max-w-full"
      options={[
        { value: 'brief', label: 'Бриф' },
        { value: 'negotiation', label: 'Переговоры' },
        { value: 'contract', label: 'Договор' },
      ]}
    />
  ),
  code: (p) => `<Select
  aria-label="Этап сделки"${p.attrs(['placeholder', 'size', 'disabled', 'required'])}
  options={[
    { value: 'brief', label: 'Бриф' },
    { value: 'negotiation', label: 'Переговоры' },
    { value: 'contract', label: 'Договор' },
  ]}
/>`,
};

export default playground;
