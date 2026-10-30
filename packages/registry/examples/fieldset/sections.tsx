import { Field, Fieldset, Input, InputAddon, Select } from '@/kvant';

const payments = [
  { value: 'invoice', label: 'Безналичный, по счёту' },
  { value: 'card', label: 'Картой онлайн' },
  { value: 'cash', label: 'Наличными в офисе' },
] as const;

export default function FieldsetSections() {
  return (
    <div className="w-full max-w-158 rounded-xl bg-surface-1 px-6 shadow-raised">
      <Fieldset variant="section" legend="Контакт со стороны клиента">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя">
            <Input name="contactName" autoComplete="name" defaultValue="Анна Северова" />
          </Field>
          <Field label="Почта">
            <Input name="contactEmail" type="email" autoComplete="email" defaultValue="anna@norda.ru" />
          </Field>
        </div>
      </Fieldset>
      <Fieldset variant="section" legend="Оплата">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Способ оплаты">
            <Select name="payment" options={payments} defaultValue="invoice" />
          </Field>
          <Field label="Отсрочка платежа">
            <Input name="delay" inputMode="numeric" defaultValue="14" suffix={<InputAddon>дней</InputAddon>} />
          </Field>
        </div>
      </Fieldset>
    </div>
  );
}
