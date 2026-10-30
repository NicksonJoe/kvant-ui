import { useEffect, useState } from 'react';
import { Link } from '@/kvant';

const WAIT_SECONDS = 42;

export default function LinkInText() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left === 0) return;
    const tick = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(tick);
  }, [left]);

  return (
    <p className="max-w-prose text-body-sm text-fg-2">
      Мы отправили код на anna@norda.ru. Не пришёл?{' '}
      {left > 0 ? (
        <Link disabled>Отправить ещё раз через 0:{String(left).padStart(2, '0')}</Link>
      ) : (
        <Link
          href="#resend"
          variant="inline"
          onClick={(event) => {
            event.preventDefault();
            setLeft(WAIT_SECONDS);
          }}
        >
          Отправить ещё раз
        </Link>
      )}
    </p>
  );
}
