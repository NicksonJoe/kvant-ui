import { MessageCircle } from 'lucide-react';
import { Avatar, Button, HoverCard, HoverCardContent, HoverCardTrigger } from '@/kvant';

const stats = [
  { value: '42', label: 'сделки в работе' },
  { value: '8,4 млн ₽', label: 'в воронке' },
  { value: '96 %', label: 'в срок' },
];

export default function HoverCardPerson() {
  return (
    <p className="flex items-center gap-2 text-label-sm text-fg-3">
      Ответственный
      <HoverCard>
        <HoverCardTrigger href="#anna-severova">
          <Avatar name="Анна Северова" size={20} />
          Анна Северова
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex items-center gap-3">
            <Avatar name="Анна Северова" size={48} status="online" />
            <div className="flex min-w-0 flex-col">
              <span className="text-label-md font-semibold text-fg-1">Анна Северова</span>
              <span className="text-body-xs text-fg-3">Аккаунт-менеджер · в сети</span>
            </div>
          </div>
          <p className="text-body-xs text-fg-2">
            Ведёт ключевых клиентов digital-направления. Отвечает в течение часа, с 10:00 до 19:00 по Москве.
          </p>
          <dl className="flex gap-6 border-t border-separator pt-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="text-caption text-fg-3">{stat.label}</dt>
                <dd className="text-heading-xs font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2 *:flex-1">
            <Button size="sm" variant="secondary" leadingIcon={<MessageCircle />}>
              Написать
            </Button>
            <Button size="sm" variant="ghost">
              Открыть профиль
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}
