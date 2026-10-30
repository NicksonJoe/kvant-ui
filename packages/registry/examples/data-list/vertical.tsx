import { Card, DataList, DataListItem } from '@/kvant';

export default function DataListVertical() {
  return (
    <Card className="w-full max-w-2xl">
      <DataList orientation="vertical">
        <DataListItem label="Клиент">«Студия Север»</DataListItem>
        <DataListItem label="Сумма">1 284 900 ₽</DataListItem>
        <DataListItem label="Вероятность">60 %</DataListItem>
        <DataListItem label="Создана">
          <time dateTime="2026-10-27">27.10.2026</time>
        </DataListItem>
        <DataListItem label="Плановое закрытие">
          <time dateTime="2026-11-14">14.11.2026</time>
        </DataListItem>
        <DataListItem label="Источник">Рекомендация</DataListItem>
        <DataListItem label="Комментарий" wide>
          Клиенту важно успеть к выставке 20 ноября. Бюджет согласован, ждём подписи на допсоглашении по анимации.
        </DataListItem>
      </DataList>
    </Card>
  );
}
