import { Card, CardHeader, OrgChart } from '@/kvant';

const company = {
  title: 'Анна Петрова',
  subtitle: 'Генеральный директор',
  value: 120,
  children: [
    {
      title: 'Сергей Ким',
      subtitle: 'Продажи',
      value: 38,
      children: [
        { title: 'Опт', subtitle: 'Игорь Лаптев', value: 14 },
        { title: 'Розница', subtitle: 'Мария Орлова', value: 16 },
        { title: 'Маркетплейсы', subtitle: 'Дина Юсупова', value: 8 },
      ],
    },
    {
      title: 'Олег Белов',
      subtitle: 'Разработка',
      value: 34,
      children: [
        { title: 'Платформа', subtitle: 'Лев Чен', value: 15 },
        { title: 'Мобильные', subtitle: 'Ника Рябова', value: 11 },
        { title: 'Данные', subtitle: 'Пётр Гусев', value: 8 },
      ],
    },
    {
      title: 'Ирина Соколова',
      subtitle: 'Поддержка',
      value: 22,
      children: [
        { title: 'Первая линия', subtitle: 'Ольга Ли', value: 14 },
        { title: 'Внедрение', subtitle: 'Артём Зуев', value: 8 },
      ],
    },
    {
      title: 'Тимур Абаев',
      subtitle: 'Маркетинг',
      value: 14,
      children: [
        { title: 'Бренд', subtitle: 'Вера Ким', value: 6 },
        { title: 'Перформанс', subtitle: 'Глеб Носов', value: 8 },
      ],
    },
  ],
};

export default function ChartHierarchyOrg() {
  return (
    <Card className="w-full">
      <CardHeader title="Оргструктура" description="Ноябрь 2026 · 120 сотрудников · число в углу — людей в подразделении" />
      <OrgChart aria-label="Оргструктура компании, ноябрь 2026" data={company} />
    </Card>
  );
}
