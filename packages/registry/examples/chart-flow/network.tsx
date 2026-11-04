import { Card, CardHeader, NetworkChart } from '@/kvant';

export const integrations = [
  { id: 'stock', label: 'Склад', group: 'Наши модули' },
  { id: 'cash', label: 'Касса', group: 'Наши модули' },
  { id: 'couriers', label: 'Курьеры', group: 'Наши модули' },
  { id: 'analytics', label: 'Аналитика', group: 'Наши модули' },
  { id: 'marketplaces', label: 'Маркетплейсы', group: 'Каналы' },
  { id: 'crm', label: 'CRM', group: 'Каналы' },
  { id: 'site', label: 'Сайт', group: 'Каналы' },
  { id: 'telegram', label: 'Telegram', group: 'Каналы' },
  { id: 'mail', label: 'Почта', group: 'Каналы' },
  { id: 'phone', label: 'Телефония', group: 'Каналы' },
  { id: 'loyalty', label: 'Лояльность', group: 'Каналы' },
  { id: '1c', label: '1С', group: 'Учёт' },
  { id: 'edo', label: 'ЭДО', group: 'Учёт' },
  { id: 'bank', label: 'Банк', group: 'Учёт' },
  { id: 'sheets', label: 'Таблицы', group: 'Учёт' },
  { id: 'accountant', label: 'Бухгалтер', group: 'Учёт' },
];

/** Accounts that have both services connected. */
export const integrationPairs = [
  { source: '1c', target: 'stock', value: 400 },
  { source: 'stock', target: 'cash', value: 400 },
  { source: '1c', target: 'edo', value: 360 },
  { source: 'stock', target: 'marketplaces', value: 360 },
  { source: '1c', target: 'bank', value: 310 },
  { source: 'crm', target: 'site', value: 310 },
  { source: 'stock', target: 'couriers', value: 270 },
  { source: 'cash', target: 'bank', value: 270 },
  { source: 'crm', target: 'telegram', value: 270 },
  { source: 'edo', target: 'accountant', value: 270 },
  { source: '1c', target: 'accountant', value: 270 },
  { source: 'cash', target: 'loyalty', value: 230 },
  { source: 'marketplaces', target: 'site', value: 230 },
  { source: 'crm', target: 'mail', value: 230 },
  { source: 'crm', target: 'phone', value: 230 },
  { source: 'bank', target: 'accountant', value: 230 },
  { source: 'analytics', target: 'stock', value: 230 },
  { source: 'analytics', target: 'crm', value: 230 },
  { source: 'crm', target: 'loyalty', value: 190 },
  { source: 'analytics', target: 'sheets', value: 190 },
  { source: 'site', target: 'telegram', value: 190 },
  { source: 'couriers', target: 'marketplaces', value: 190 },
  { source: 'sheets', target: '1c', value: 140 },
  { source: 'marketplaces', target: 'analytics', value: 140 },
  { source: 'phone', target: 'telegram', value: 100 },
];

export default function ChartFlowNetwork() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Какие интеграции подключают вместе" description="Клиенты 2026 · узел — сервис, линия — пара в одном аккаунте, толщина — как часто" />
      <NetworkChart aria-label="Интеграции, которые подключают вместе" nodes={integrations} links={integrationPairs} />
    </Card>
  );
}
