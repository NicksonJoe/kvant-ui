import { SearchX } from 'lucide-react';
import { Button, EmptyState } from '@/kvant';

export default function EmptyStateNoResults() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="Ничего не найдено"
      description="По запросу «Парусник» клиентов нет. Проверьте написание или сбросьте фильтры."
      actions={
        <Button size="sm" variant="secondary">
          Сбросить фильтры
        </Button>
      }
    />
  );
}
