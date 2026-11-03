import { useEffect, useState } from 'react';
import { Button, TransferList, type TransferItem } from '@/kvant';

const people: TransferItem[] = [
  { id: 'kim', label: 'Мария Ким', description: 'Бухгалтерия' },
  { id: 'belova', label: 'Тамара Белова', description: 'Логистика' },
  { id: 'lebedev', label: 'Олег Лебедев', description: 'Продажи · опт' },
];

type Stage = 'loading' | 'error' | 'ready';

export default function TransferListStates() {
  const [stage, setStage] = useState<Stage>('loading');
  const [attempt, setAttempt] = useState(0);
  // The first load fails, the retry succeeds.
  useEffect(() => {
    if (stage !== 'loading') return;
    const timer = window.setTimeout(() => setStage(attempt === 0 ? 'error' : 'ready'), 1200);
    return () => window.clearTimeout(timer);
  }, [stage, attempt]);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <TransferList
        items={stage === 'ready' ? people : []}
        titles={['Сотрудники', 'Участники рассылки']}
        rows={4}
        loading={stage === 'loading'}
        error={stage === 'error' ? { title: 'Не удалось загрузить сотрудников', description: 'Нет соединения с сервером' } : undefined}
        onRetry={() => {
          setAttempt(attempt + 1);
          setStage('loading');
        }}
        className="w-full"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setAttempt(0);
          setStage('loading');
        }}
      >
        Загрузить заново
      </Button>
    </div>
  );
}
