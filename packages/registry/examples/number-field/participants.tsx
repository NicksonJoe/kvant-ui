import { useState } from 'react';
import { Field, NumberField } from '@/kvant';

const MAX = 20;

export default function NumberFieldParticipants() {
  const [count, setCount] = useState<number | null>(4);
  const tooMany = count !== null && count > MAX;
  return (
    <Field
      label="Участников"
      description={tooMany ? undefined : `От 1 до ${MAX}`}
      error={tooMany ? `Не больше ${MAX} участников` : undefined}
    >
      {/* allowOutOfRange keeps a typed 25 so the field can say what is wrong instead of silently fixing it. */}
      <NumberField name="participants" value={count} onValueChange={setCount} min={1} max={MAX} allowOutOfRange />
    </Field>
  );
}
