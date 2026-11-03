import { JsonDiff } from '@/kvant';

const before = `title: Сайт и CRM-интеграция
stage: negotiation
amount: 580000
owner: Илья Громов
client: Орбита Лаб
contact: Илья Громов
phone: +7 900 123-45-67
source: заявка с сайта
created: 2026-09-14
pipeline: Продажи
probability: 40 %
currency: RUB
vat: 20 %
manager: Илья Громов
team: Студия
priority: высокий
tags: сайт, CRM
region: Москва
channel: входящий
lead: 1188
discount: 5 %
due: 2026-11-21`;

const after = before.replace('stage: negotiation', 'stage: contract').replace('amount: 580000', 'amount: 640000').replace('discount: 5 %', 'prepayment: 50 %');

/** Record history: side by side from 1024 px, one column below; long unchanged runs fold. */
export default function Diff() {
  return (
    <JsonDiff
      className="w-full"
      title="deal-1042.yaml"
      meta="версия 3 → 4 · Илья Громов, сегодня 11:20"
      before={before}
      after={after}
    />
  );
}
