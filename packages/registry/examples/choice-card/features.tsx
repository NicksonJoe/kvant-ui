import { ChartColumn, CreditCard, Send, Shield } from 'lucide-react';
import { ChoiceCard, ChoiceCardGroup } from '@/kvant';

export default function ChoiceCardFeatures() {
  return (
    <ChoiceCardGroup multiple aria-label="Возможности" defaultValue={['payments', 'analytics']} className="w-full grid-cols-2 lg:grid-cols-4">
      <ChoiceCard value="payments" icon={<CreditCard />} title="Онлайн-оплата" description="Ссылка на оплату в каждом счёте" />
      <ChoiceCard value="mailing" icon={<Send />} title="Рассылки клиентам" description="Письма по сегментам и шаблонам" />
      <ChoiceCard value="analytics" icon={<ChartColumn />} title="Аналитика воронки" description="Конверсия этапов и прогноз выручки" />
      <ChoiceCard value="sso" icon={<Shield />} title="Единый вход через SSO" description="Доступно на тарифе «Студия»" disabled />
    </ChoiceCardGroup>
  );
}
