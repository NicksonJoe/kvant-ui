import { Card, CardHeader, RagList } from '@/kvant';

export default function ChartStatusRag() {
  return (
    <Card className="w-full">
      <CardHeader title="Светофор KPI" description="Октябрь 2026 · статус каждого показателя против плана, справа — владелец" />
      <RagList
        aria-label="Светофор KPI, октябрь 2026"
        items={[
          { label: 'Выручка', value: '18,4 млн ₽', target: 'план 18,0', owner: 'Сергей', status: 'green' },
          { label: 'Конверсия сайта', value: '2,9 %', target: 'план 3,2 %', owner: 'Анна', status: 'amber' },
          { label: 'Средний чек', value: '2 840 ₽', target: 'план 2 700', owner: 'Сергей', status: 'green' },
          { label: 'Отток клиентов', value: '6,1 %', target: 'не выше 4 %', owner: 'Ирина', status: 'red' },
          { label: 'NPS', value: '+62', target: 'цель +70', owner: 'Ирина', status: 'amber' },
          { label: 'Доставка в срок', value: '96 %', target: 'не ниже 95 %', owner: 'Олег', status: 'green' },
          { label: 'Время ответа', value: '1,8 ч', target: 'не дольше 2 ч', owner: 'Олег', status: 'green' },
        ]}
      />
    </Card>
  );
}
