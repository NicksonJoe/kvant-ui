import { Avatar, Badge, DataList, DataListItem } from '@/kvant';

export default function DataListDeal() {
  return (
    <div className="w-full max-w-xl rounded-xl bg-surface-1 px-5 py-1 shadow-raised">
      <DataList>
        <DataListItem label="Клиент">«Студия Север»</DataListItem>
        <DataListItem label="Ответственный">
          <span className="flex items-center gap-2">
            <Avatar name="Анна Северова" size={24} />
            Анна Северова
          </span>
        </DataListItem>
        <DataListItem label="Этап">
          <Badge tone="info">Переговоры</Badge>
        </DataListItem>
        <DataListItem label="Сумма">1 284 900 ₽</DataListItem>
        <DataListItem label="Плановое закрытие">
          <time dateTime="2026-11-14">14.11.2026</time>
        </DataListItem>
        <DataListItem label="ИНН" copyValue="7704512386">
          7704512386
        </DataListItem>
      </DataList>
    </div>
  );
}
