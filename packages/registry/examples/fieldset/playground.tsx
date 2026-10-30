import { Field, Fieldset, Input } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { legend: 'Реквизиты для документов', description: 'Попадут в счёт и акт. Можно заполнить позже, до первого счёта.' },
  render: (p) => (
    <Fieldset
      legend={p.text('legend')}
      description={p.text('description') || undefined}
      variant={p.pick('variant', ['card', 'section'] as const)}
      disabled={p.bool('disabled')}
      className="w-full max-w-104"
    >
      <Field label="ИНН">
        <Input inputMode="numeric" defaultValue="7704123456" />
      </Field>
      <Field label="Юридическое название">
        <Input defaultValue="ООО «Студия Север»" />
      </Field>
    </Fieldset>
  ),
  code: (p) => `<Fieldset${p.attrs(['legend', 'description', 'variant', 'disabled'])}>
  <Field label="ИНН">
    <Input inputMode="numeric" defaultValue="7704123456" />
  </Field>
  <Field label="Юридическое название">
    <Input defaultValue="ООО «Студия Север»" />
  </Field>
</Fieldset>`,
};

export default playground;
