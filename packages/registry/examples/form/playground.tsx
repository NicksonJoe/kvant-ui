import { Button, Field, Form, FormActions, FormErrorSummary, Input } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const email = (value: unknown) => (/^\S+@\S+\.\S+$/.test(String(value)) ? null : 'Укажите почту в формате name@domain.ru');

const playground: Playground = {
  controls: [{ name: 'summary', type: 'boolean', default: false, description: 'Сводка ошибок после неудачной отправки.' }],
  render: (p) => (
    <Form
      validationMode={p.pick('validationMode', ['onBlur', 'onSubmit', 'onChange'] as const)}
      onFormSubmit={() => undefined}
      className="w-80 max-w-full"
    >
      {p.bool('summary') ? <FormErrorSummary errors={[{ name: 'email', label: 'Почта', message: 'укажите почту в формате name@domain.ru' }]} /> : null}
      <Field label="Рабочая почта" name="email" validate={email}>
        <Input inputMode="email" autoComplete="email" placeholder="anna@norda.ru" />
      </Field>
      <FormActions>
        <Button type="submit">Пригласить</Button>
      </FormActions>
    </Form>
  ),
  code: (p) => `<Form${p.attrs(['validationMode'])} onFormSubmit={invite}>${
    p.bool('summary')
      ? `
  <FormErrorSummary errors={[{ name: 'email', label: 'Почта', message: 'укажите почту в формате name@domain.ru' }]} />`
      : ''
  }
  <Field label="Рабочая почта" name="email" validate={email}>
    <Input inputMode="email" autoComplete="email" placeholder="anna@norda.ru" />
  </Field>
  <FormActions>
    <Button type="submit">Пригласить</Button>
  </FormActions>
</Form>`,
};

export default playground;
