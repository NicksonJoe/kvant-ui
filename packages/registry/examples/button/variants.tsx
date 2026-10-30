import { Button } from '@/kvant';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>Создать сделку</Button>
      <Button variant="secondary">Экспорт</Button>
      <Button variant="soft">Пригласить</Button>
      <Button variant="outline">Фильтры</Button>
      <Button variant="ghost">Отмена</Button>
      <Button variant="danger">Удалить</Button>
      <Button variant="danger-soft">Архивировать</Button>
      <Button variant="link">Подробнее</Button>
    </div>
  );
}
