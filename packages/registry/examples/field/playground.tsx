import { Field, Input } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Почта', description: 'На неё придёт счёт', placeholder: 'name@domain.ru' },
  controls: [{ name: 'placeholder', type: 'string', description: 'Подсказка внутри поля.' }],
  render: (p) => (
    <Field
      label={p.text('label') || undefined}
      description={p.text('description') || undefined}
      error={p.text('error') || undefined}
      optional={p.bool('optional')}
      disabled={p.bool('disabled')}
      className="w-80 max-w-full"
    >
      <Input type="email" placeholder={p.text('placeholder')} />
    </Field>
  ),
  code: (p) => `<Field${p.attrs(['label', 'description', 'error', 'optional', 'disabled'])}>
  <Input type="email"${p.attrs(['placeholder'])} />
</Field>`,
};

export default playground;
