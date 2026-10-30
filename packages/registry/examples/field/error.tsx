import { Field, Input } from '@/kvant';

export default function FieldError() {
  return (
    <Field label="Почта" error="Укажите почту в формате name@domain.ru" className="w-80">
      <Input type="email" defaultValue="anna.sever@" />
    </Field>
  );
}
