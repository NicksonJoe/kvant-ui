import { CreditCard, Send } from 'lucide-react';
import { ChoiceCard, ChoiceCardGroup } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) =>
    p.bool('multiple') ? (
      <ChoiceCardGroup multiple aria-label="Возможности" defaultValue={['payments']} disabled={p.bool('disabled')} className="w-72 max-w-full">
        <ChoiceCard value="payments" icon={<CreditCard />} title="Онлайн-оплата" description="Ссылка на оплату в каждом счёте" />
        <ChoiceCard value="mailing" icon={<Send />} title="Рассылки клиентам" description="Письма по сегментам и шаблонам" />
      </ChoiceCardGroup>
    ) : (
      <ChoiceCardGroup aria-label="Доставка документов" defaultValue="edo" disabled={p.bool('disabled')} className="w-72 max-w-full">
        <ChoiceCard value="courier" title="Курьером" description="Москва и Петербург, 1–2 дня" />
        <ChoiceCard value="edo" title="Через ЭДО" description="Подпишем за несколько минут" />
      </ChoiceCardGroup>
    ),
  code: (p) =>
    p.bool('multiple')
      ? `<ChoiceCardGroup multiple aria-label="Возможности" defaultValue={['payments']}${p.attrs(['disabled'])}>
  <ChoiceCard value="payments" icon={<CreditCard />} title="Онлайн-оплата" description="Ссылка на оплату в каждом счёте" />
  <ChoiceCard value="mailing" icon={<Send />} title="Рассылки клиентам" description="Письма по сегментам и шаблонам" />
</ChoiceCardGroup>`
      : `<ChoiceCardGroup aria-label="Доставка документов" defaultValue="edo"${p.attrs(['disabled'])}>
  <ChoiceCard value="courier" title="Курьером" description="Москва и Петербург, 1–2 дня" />
  <ChoiceCard value="edo" title="Через ЭДО" description="Подпишем за несколько минут" />
</ChoiceCardGroup>`,
};

export default playground;
