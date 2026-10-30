import { CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Field, Input, InputAddon, Spinner } from '@/kvant';

const TAKEN = 'studio-sever';

export default function InputGroupCheck() {
  const [address, setAddress] = useState(TAKEN);
  const [status, setStatus] = useState<'checking' | 'taken' | 'free'>('taken');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const check = (next: string) => {
    setAddress(next);
    setStatus('checking');
    clearTimeout(timer.current);
    // The check starts 400 ms after typing stops; the server answers a moment later.
    timer.current = setTimeout(() => setStatus(next.trim() === TAKEN ? 'taken' : 'free'), 900);
  };

  return (
    <Field
      label="Адрес студии"
      className="w-80 max-w-full"
      error={status === 'taken' ? `Адрес занят. Свободен ${TAKEN}-lab` : undefined}
      description={
        status === 'checking' ? (
          `Проверяем ${address}…`
        ) : status === 'free' ? (
          <span className="text-success-soft-fg">Адрес свободен: {address}.norda.ru</span>
        ) : undefined
      }
    >
      <Input
        name="slug"
        value={address}
        onValueChange={check}
        aria-busy={status === 'checking' || undefined}
        suffix={
          status === 'checking' ? (
            <Spinner size={16} />
          ) : status === 'free' ? (
            <CircleCheck aria-hidden className="text-success!" />
          ) : (
            <InputAddon>.norda.ru</InputAddon>
          )
        }
      />
    </Field>
  );
}
