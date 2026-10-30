import { Button } from '@/kvant';

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button size="xs">Изменить</Button>
      <Button size="sm">Изменить</Button>
      <Button size="md">Изменить</Button>
      <Button size="lg">Изменить</Button>
      <Button size="xl">Оформить заказ</Button>
    </div>
  );
}
