import { Field, Input } from '@/kvant';

export default function FieldWithDescription() {
  return (
    <Field label="Телефон" description="Пришлём СМС с кодом подтверждения" className="w-80">
      <Input type="tel" placeholder="+7 900 000-00-00" />
    </Field>
  );
}
