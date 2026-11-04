import { Card, CardHeader, MindMap } from '@/kvant';

export default function ChartHierarchyLaunch() {
  return (
    <Card className="w-full">
      <CardHeader title="План запуска" description="Ноябрь 2026 · ветка — направление, лист — задача" />
      <MindMap
        aria-label="План запуска Kvant 2.0"
        data={{
          label: 'Запуск Kvant 2.0',
          children: [
            { label: 'Продукт', children: [{ label: 'Тариф «Про»' }, { label: 'Офлайн-режим' }, { label: 'Импорт из 1С' }] },
            { label: 'Маркетинг', children: [{ label: 'Лендинг' }, { label: 'Вебинар' }, { label: 'Партнёры' }] },
            { label: 'Продажи', children: [{ label: 'Скрипт демо' }, { label: 'Скидка до 31.12' }] },
            { label: 'Поддержка', children: [{ label: 'База знаний' }, { label: 'Обучение' }, { label: 'Чат 24/7' }] },
            { label: 'Метрики', children: [{ label: 'MRR' }, { label: 'Отток' }] },
          ],
        }}
      />
    </Card>
  );
}
