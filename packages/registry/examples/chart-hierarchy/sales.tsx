import { Card, CardHeader, OrgChart } from '@/kvant';

const sales = {
  title: 'Сергей Ким',
  subtitle: 'Директор по продажам',
  value: 38,
  children: [
    {
      title: 'Опт',
      subtitle: 'Игорь Лаптев',
      value: 14,
      children: [
        { title: 'Ключевые клиенты', subtitle: 'Вера Ким', value: 4, children: [{ title: 'Сети', subtitle: 'Пётр Гусев', value: 2 }, { title: 'Дистрибьюторы', subtitle: 'Лев Чен', value: 2 }] },
        { title: 'Регионы', subtitle: 'Глеб Носов', value: 10, children: [{ title: 'Урал', subtitle: 'Ника Рябова', value: 4 }, { title: 'Сибирь', subtitle: 'Артём Зуев', value: 6 }] },
      ],
    },
    {
      title: 'Розница',
      subtitle: 'Мария Орлова',
      value: 16,
      children: [
        { title: 'Москва', subtitle: 'Ольга Ли', value: 9 },
        { title: 'Санкт-Петербург', subtitle: 'Тимур Абаев', value: 7 },
      ],
    },
    { title: 'Маркетплейсы', subtitle: 'Дина Юсупова', value: 8 },
  ],
};

export default function ChartHierarchySales() {
  return (
    <Card className="w-full">
      <CardHeader title="Отдел продаж" description="Четыре уровня: глубже третьего ветки свёрнуты, нажмите на карточку или → на клавиатуре" />
      <OrgChart aria-label="Структура отдела продаж" data={sales} />
    </Card>
  );
}
