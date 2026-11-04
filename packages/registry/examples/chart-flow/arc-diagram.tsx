import { ArcDiagramChart, Card, CardHeader } from '@/kvant';

export const shopSections = [
  { id: 'home', label: 'Главная', value: 100_000 },
  { id: 'catalog', label: 'Каталог', value: 78_000 },
  { id: 'card', label: 'Карточка', value: 64_000 },
  { id: 'cart', label: 'Корзина', value: 31_000 },
  { id: 'checkout', label: 'Оформление', value: 22_000 },
  { id: 'payment', label: 'Оплата', value: 18_000 },
  { id: 'done', label: 'Готово', value: 16_000 },
  { id: 'profile', label: 'Профиль', value: 27_000 },
  { id: 'orders', label: 'Заказы', value: 21_000 },
  { id: 'support', label: 'Поддержка', value: 9_000 },
];

export const shopPaths = [
  { source: 'home', target: 'catalog', value: 62_000 },
  { source: 'catalog', target: 'card', value: 48_000 },
  { source: 'card', target: 'cart', value: 24_000 },
  { source: 'cart', target: 'checkout', value: 19_000 },
  { source: 'home', target: 'profile', value: 18_000 },
  { source: 'checkout', target: 'payment', value: 16_000 },
  { source: 'payment', target: 'done', value: 15_000 },
  { source: 'profile', target: 'orders', value: 15_000 },
  { source: 'home', target: 'card', value: 14_000 },
  { source: 'card', target: 'checkout', value: 6_000 },
  { source: 'home', target: 'support', value: 5_000 },
  { source: 'catalog', target: 'cart', value: 5_000 },
  { source: 'orders', target: 'support', value: 4_000 },
  { source: 'card', target: 'catalog', value: 22_000 },
  { source: 'cart', target: 'card', value: 9_000 },
  { source: 'done', target: 'home', value: 7_000 },
  { source: 'orders', target: 'home', value: 6_000 },
  { source: 'checkout', target: 'cart', value: 4_000 },
  { source: 'cart', target: 'catalog', value: 4_000 },
  { source: 'payment', target: 'checkout', value: 3_000 },
  { source: 'support', target: 'home', value: 3_000 },
];

export default function ChartFlowArcDiagram() {
  return (
    <Card className="w-full">
      <CardHeader title="Пути по разделам магазина" description="Октябрь 2026, сессии · сверху — шаг вперёд по воронке, снизу — возврат назад" />
      <ArcDiagramChart aria-label="Переходы между разделами магазина, октябрь 2026" nodes={shopSections} links={shopPaths} />
    </Card>
  );
}
