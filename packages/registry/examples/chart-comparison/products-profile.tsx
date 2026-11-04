import { Card, CardHeader, ParallelCoordinatesChart } from '@/kvant';

const one = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = (value: number) => Math.round(value).toLocaleString('ru-RU');

export default function ChartComparisonProductsProfile() {
  return (
    <Card className="w-full">
      <CardHeader title="Профиль товаров по шести метрикам" description="16 товаров, октябрь 2026 · оси с ↓ перевёрнуты: меньше — лучше, оно наверху" />
      <ParallelCoordinatesChart
        aria-label="Профиль 16 товаров по цене, марже, продажам, рейтингу, возвратам и сроку доставки"
        highlight={['Склад Pro', 'Касса Мини']}
        axes={[
          { label: 'Цена, тыс ₽', min: 0, max: 12, format: one },
          { label: 'Маржа, %', min: 0, max: 50, format: whole },
          { label: 'Продажи, шт', min: 0, max: 900, format: whole },
          { label: 'Рейтинг', min: 3, max: 5, format: one },
          { label: 'Возвраты, %', min: 0, max: 12, invert: true, format: one },
          { label: 'Доставка, дн', min: 0, max: 8, invert: true, format: one },
        ]}
        rows={[
          { name: 'Склад Pro', values: [9.5, 42, 610, 4.8, 2.1, 1.5] },
          { name: 'Касса Мини', values: [2.2, 14, 140, 3.7, 9.4, 6.2] },
          { name: 'Склад Lite', values: [3.4, 14, 390, 3.6, 1.6, 4.6] },
          { name: 'Касса Онлайн', values: [10.1, 36, 670, 3.7, 7.5, 3.9] },
          { name: 'Маркетплейс-коннектор', values: [2.8, 14, 220, 4.8, 9.1, 7.1] },
          { name: 'Учёт ЭДО', values: [9.0, 16, 320, 4.3, 8.3, 7.3] },
          { name: 'Курьерский модуль', values: [9.8, 13, 540, 4.4, 6.2, 2.0] },
          { name: 'Аналитика', values: [5.9, 13, 800, 4.7, 6.5, 3.1] },
          { name: 'CRM Старт', values: [10.0, 34, 740, 4.7, 6.2, 4.5] },
          { name: 'CRM Бизнес', values: [7.1, 23, 210, 3.8, 9.5, 1.2] },
          { name: 'Бухгалтерия', values: [1.5, 32, 300, 4.2, 5.7, 3.1] },
          { name: 'Зарплата', values: [10.9, 15, 330, 3.8, 7.4, 3.0] },
          { name: 'Онлайн-запись', values: [4.6, 36, 320, 4.2, 10.4, 1.6] },
          { name: 'Телефония', values: [1.6, 18, 670, 4.3, 3.3, 2.9] },
          { name: 'Чат-бот', values: [2.8, 25, 40, 4.4, 9.9, 7.5] },
          { name: 'Лояльность', values: [8.4, 44, 50, 3.6, 10.6, 5.7] },
        ]}
      />
    </Card>
  );
}
