import { useState } from 'react';
import { Field, MaskedInput } from '@/kvant';

const DIGITS = 10;
const plural = new Intl.PluralRules('ru');
const digitWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'цифры' };

export default function MaskedInputPhone() {
  const [digits, setDigits] = useState('9123456');
  const [left, setLeft] = useState(false);
  const missing = DIGITS - digits.length;
  // The error waits for the field to be left: half a number while typing is not a mistake.
  const error = left && missing > 0 ? `Не хватает ${missing} ${digitWords[plural.select(missing)] ?? 'цифр'}` : undefined;
  return (
    <Field label="Телефон" error={error} className="w-76 max-w-full">
      <MaskedInput
        name="phone"
        mask="(###) ###-##-##"
        prefix="+7"
        inputMode="tel"
        autoComplete="tel-national"
        value={digits}
        onValueChange={setDigits}
        onFocus={() => setLeft(false)}
        onBlur={() => setLeft(true)}
      />
    </Field>
  );
}
