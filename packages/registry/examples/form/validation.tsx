import { useState } from 'react';
import { Button, Field, Form, FormActions, Input, toast } from '@/kvant';

const email = (value: unknown) => (/^\S+@\S+\.\S+$/.test(String(value)) ? null : 'Укажите почту в формате name@domain.ru');
const name = (value: unknown) => (String(value).trim() ? null : 'Напишите, как обращаться к коллеге');

export default function FormValidation() {
  const [sent, setSent] = useState(0);
  return (
    <Form
      key={sent}
      className="w-full max-w-96"
      onFormSubmit={(values) => {
        toast.add({ title: 'Приглашение отправлено', description: String(values.email), type: 'success' });
        setSent((count) => count + 1);
      }}
    >
      <Field label="Имя" name="name" validate={name}>
        <Input autoComplete="name" placeholder="Илья Ким" />
      </Field>
      <Field label="Рабочая почта" name="email" description="Сюда придёт приглашение в проект" validate={email}>
        <Input inputMode="email" autoComplete="email" placeholder="ilya@norda.ru" />
      </Field>
      <FormActions>
        <Button type="submit">Пригласить</Button>
      </FormActions>
    </Form>
  );
}
