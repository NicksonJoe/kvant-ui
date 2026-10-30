import { Field, MaskedInput } from '@/kvant';

export default function MaskedInputCard() {
  return (
    <div className="flex w-76 max-w-full flex-col gap-4">
      <Field label="Номер карты">
        <MaskedInput name="card" mask="#### #### #### ####" autoComplete="cc-number" defaultValue="2200123456789012" />
      </Field>
      <Field label="Дата рождения" optional>
        <MaskedInput name="birthday" mask="##.##.####" autoComplete="bday" />
      </Field>
    </div>
  );
}
