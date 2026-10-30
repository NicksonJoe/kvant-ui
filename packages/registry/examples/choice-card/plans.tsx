import { Check } from 'lucide-react';
import { ChoiceCard, ChoiceCardGroup } from '@/kvant';

const plans = [
  {
    value: 'start',
    title: 'Старт',
    description: 'Для фрилансеров и студий до 3 человек',
    price: '0 ₽',
    period: 'навсегда',
    features: ['3 воронки продаж', 'Счета и акты по шаблону', 'Напоминания о задачах'],
  },
  {
    value: 'team',
    title: 'Команда',
    description: 'Для агентств, где сделки ведут несколько менеджеров',
    price: '15 000 ₽',
    period: 'в месяц за 10 мест',
    features: ['Воронки без ограничений', 'Роли и права доступа', 'Отчёты по менеджерам'],
  },
  {
    value: 'studio',
    title: 'Студия',
    description: 'Для студий с собственным отделом продаж',
    price: '1 500 ₽',
    period: 'за место в месяц',
    features: ['Единый вход и журнал действий', 'Синхронизация с бухгалтерией', 'Персональный менеджер'],
  },
];

export default function ChoiceCardPlans() {
  return (
    <ChoiceCardGroup aria-label="Тариф" defaultValue="team" className="w-full md:grid-cols-3">
      {plans.map((plan) => (
        <ChoiceCard key={plan.value} value={plan.value} title={plan.title} description={plan.description}>
          <p className="flex items-baseline gap-1.5">
            <span className="text-heading-lg font-semibold tabular-nums">{plan.price}</span>
            <span className="text-body-xs text-fg-3">{plan.period}</span>
          </p>
          <ul className="flex flex-col gap-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-body-xs text-fg-2">
                <Check aria-hidden className="size-3.5 shrink-0 stroke-[1.75] text-fg-3" />
                {feature}
              </li>
            ))}
          </ul>
        </ChoiceCard>
      ))}
    </ChoiceCardGroup>
  );
}
