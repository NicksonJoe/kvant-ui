import { Plus, Wallet } from 'lucide-react';
import { Button, EmptyState } from '@/kvant';

export default function EmptyStateFirstRun() {
  return (
    <EmptyState
      icon={<Wallet />}
      title="Сделок пока нет"
      description="Добавьте первую сделку или импортируйте их из таблицы — воронка соберётся сама."
      actions={
        <>
          <Button size="sm" leadingIcon={<Plus />}>
            Новая сделка
          </Button>
          <Button size="sm" variant="ghost">
            Импорт из Excel
          </Button>
        </>
      }
    />
  );
}
