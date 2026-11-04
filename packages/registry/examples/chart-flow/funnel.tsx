import { Card, CardHeader, FunnelChart } from '@/kvant';

export const orderFunnel = [
  { label: 'Посетители', value: 48_000 },
  { label: 'Карточка товара', value: 21_600 },
  { label: 'Корзина', value: 6_480 },
  { label: 'Оформление', value: 3_240 },
  { label: 'Оплата', value: 2_590 },
];

export default function ChartFlowFunnel() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Воронка заказа" description="Октябрь 2026 · люди на каждом шаге и переход с прошлого" />
      <FunnelChart aria-label="Воронка заказа, октябрь 2026" data={orderFunnel} />
    </Card>
  );
}
