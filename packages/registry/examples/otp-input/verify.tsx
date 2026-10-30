import { useEffect, useRef, useState } from 'react';
import { Field, Link, OtpInput, Spinner } from '@/kvant';

const RIGHT_CODE = '482913';

export default function OtpInputVerify() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'wrong' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const verify = (value: string) => {
    setStatus('checking');
    timer.current = setTimeout(() => {
      if (value === RIGHT_CODE) {
        setStatus('done');
        return;
      }
      setStatus('wrong');
      // After the 300 ms shake the cells empty for the next try.
      timer.current = setTimeout(() => setCode(''), 300);
    }, 800);
  };

  return (
    <Field
      label="Код из письма"
      description={
        status === 'idle' ? (
          'Код отправили на anna@norda.ru. Подсказка для примера: 482913'
        ) : status === 'checking' ? (
          <span className="inline-flex items-center gap-1.5">
            <Spinner size={16} /> Проверяем код…
          </span>
        ) : status === 'done' ? (
          <span className="text-success-soft-fg">Почта подтверждена — открываем «Норду»</span>
        ) : undefined
      }
      error={
        status === 'wrong' ? (
          <>
            Код не подошёл, осталось 2 попытки.{' '}
            <Link href="#resend" variant="inline">
              Прислать новый
            </Link>
          </>
        ) : undefined
      }
    >
      <OtpInput
        value={code}
        onValueChange={(value) => {
          setCode(value);
          if (status === 'wrong') setStatus('idle');
        }}
        onValueComplete={verify}
        readOnly={status === 'checking' || status === 'done'}
        invalid={status === 'wrong'}
        success={status === 'done'}
      />
    </Field>
  );
}
