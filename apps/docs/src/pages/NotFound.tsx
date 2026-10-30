import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState, buttonClasses } from '@/kvant';

export function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <h1 className="sr-only">Страница не найдена</h1>
      <EmptyState
        icon={<Compass />}
        title="Такой страницы нет"
        description="Возможно, компонент переименовали. Найдите его в каталоге или через поиск ⌘K."
        actions={
          <Link to="/components" className={buttonClasses({ size: 'sm' })}>
            К компонентам
          </Link>
        }
      />
    </div>
  );
}
