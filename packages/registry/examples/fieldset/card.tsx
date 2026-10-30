import { Checkbox, Field, Fieldset, Input } from '@/kvant';

export default function FieldsetCard() {
  return (
    <Fieldset
      legend="Реквизиты для документов"
      description="Попадут в счёт и акт. Можно заполнить позже, до первого счёта."
      className="w-full max-w-158"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ИНН">
          <Input name="inn" inputMode="numeric" defaultValue="7704123456" />
        </Field>
        <Field
          label={
            <>
              КПП <span className="font-regular text-fg-3">для ООО</span>
            </>
          }
        >
          <Input name="kpp" inputMode="numeric" defaultValue="770401001" />
        </Field>
      </div>
      <Field label="Юридическое название">
        <Input name="legalName" defaultValue="ООО «Студия Север»" />
      </Field>
      <Field label="Юридический адрес">
        <Input name="legalAddress" autoComplete="street-address" defaultValue="Москва, ул. Большая Новодмитровская, 36, стр. 4" />
      </Field>
      <Checkbox name="sameAddress" defaultChecked>
        Фактический адрес совпадает с юридическим
      </Checkbox>
    </Fieldset>
  );
}
