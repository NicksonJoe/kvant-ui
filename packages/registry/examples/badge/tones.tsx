import { Badge } from '@/kvant';

export default function BadgeTones() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge>Черновик</Badge>
      <Badge tone="accent">Новый</Badge>
      <Badge tone="success">Оплачено</Badge>
      <Badge tone="warning">Ждёт ответа</Badge>
      <Badge tone="danger">Просрочено</Badge>
      <Badge tone="info">Бета</Badge>
    </div>
  );
}
