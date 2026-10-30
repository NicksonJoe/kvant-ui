import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button, EmptyState } from '@/kvant';

/** A failed load: danger circle, «Повторить» goes into loading and the state stays until the answer comes. */
export default function EmptyStateError() {
  const [retrying, setRetrying] = useState(false);

  return (
    <EmptyState
      tone="danger"
      icon={<TriangleAlert />}
      title="Не удалось загрузить сделки"
      description="Сервер не ответил за 30 секунд. Данные не потеряны — попробуйте ещё раз."
      actions={
        <>
          <Button
            size="sm"
            leadingIcon={<RefreshCw />}
            loading={retrying}
            onClick={() => {
              setRetrying(true);
              setTimeout(() => setRetrying(false), 1500);
            }}
          >
            Повторить
          </Button>
          <Button size="sm" variant="ghost">
            Сообщить о проблеме
          </Button>
        </>
      }
    >
      <span className="font-mono text-overline font-medium text-fg-3">код 504 · запрос 8f3a-2c1d</span>
    </EmptyState>
  );
}
