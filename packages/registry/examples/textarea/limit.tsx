import { useState } from 'react';
import { Field, Textarea } from '@/kvant';

const LIMIT = 140;
const plural = new Intl.PluralRules('ru');
const charWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'символ', few: 'символа' };

export default function TextareaLimit() {
  const [text, setText] = useState(
    'Перенесли презентацию на четверг, 14:00. Нужны логотипы в SVG и шрифты из брендбука — пришлите, пожалуйста, до вторника, 12:00. Спасибо, что так быстро!',
  );
  const over = text.length - LIMIT;
  return (
    <Field
      label="Сообщение клиенту"
      error={over > 0 ? `Сократите текст на ${over} ${charWords[plural.select(over)] ?? 'символов'}` : undefined}
      className="w-96 max-w-full"
    >
      <Textarea maxLength={LIMIT} value={text} onValueChange={setText} />
    </Field>
  );
}
