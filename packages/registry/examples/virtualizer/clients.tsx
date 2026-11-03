import { useMemo, useRef, useState } from 'react';
import { Avatar, Badge, VirtualList, type VirtualListGroup } from '@/kvant';

interface Client {
  name: string;
  place: string;
  deals: number;
  sum: number;
}

const TOTAL = 1284;
const PAGE = 50;
const WORDS = ['Аврора', 'Берёза', 'Верес', 'Гавань', 'Дубрава', 'Ель', 'Зерно', 'Искра', 'Клевер', 'Лён', 'Мёд', 'Нива', 'Овёс', 'Пряник', 'Роса', 'Сосна', 'Тмин', 'Уют', 'Фасад', 'Хмель', 'Чай', 'Ярмарка'];
const PLACES = ['Казань · Ольга Миронова', 'Самара · Дарья Котова', 'Пермь · Глеб Орлов', 'Тула · Семён Гусев', 'Вологда · Инна Лаптева', 'Тверь · Яна Соколова'];
const plural = new Intl.PluralRules('ru');
const clientWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'клиент', few: 'клиента', many: 'клиентов' };
const dealWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'сделка', few: 'сделки', many: 'сделок' };
const clients = (count: number) => `${count.toLocaleString('ru-RU')} ${clientWords[plural.select(count)] ?? 'клиента'}`;

// 1 284 clients by the first letter; the counts are made up but add up to the total
const groups: VirtualListGroup[] = WORDS.map((word, at) => {
  const count = at === WORDS.length - 1 ? TOTAL - 58 * (WORDS.length - 1) : 58;
  return { title: word[0] ?? '', description: clients(count), count };
});
const wordOf: string[] = groups.flatMap((group, at) => Array.from({ length: group.count }, () => WORDS[at] ?? ''));

// the server: a page of 50 clients after 400 ms
function fetchPage(page: number): Promise<Client[]> {
  const from = page * PAGE;
  const rows = Array.from({ length: Math.min(PAGE, TOTAL - from) }, (_, at) => {
    const index = from + at;
    return { name: `«${wordOf[index]} ${index + 1}»`, place: PLACES[index % PLACES.length] ?? '', deals: (index % 7) + 1, sum: ((index * 37) % 120) * 10_000 + 40_000 };
  });
  return new Promise((resolve) => setTimeout(() => resolve(rows), 400));
}

export default function VirtualizerClients() {
  const [loaded, setLoaded] = useState<Map<number, Client>>(() => new Map());
  const requested = useRef(new Set<number>());

  const load = (start: number, end: number) => {
    for (let page = Math.floor(start / PAGE); page <= Math.floor(end / PAGE); page++) {
      if (requested.current.has(page)) continue;
      requested.current.add(page);
      void fetchPage(page).then((rows) =>
        setLoaded((current) => {
          const next = new Map(current);
          rows.forEach((client, at) => next.set(page * PAGE + at, client));
          return next;
        }),
      );
    }
  };

  const footer = useMemo(
    () => (
      <p className="flex h-16 items-center justify-center gap-3 text-body-sm text-fg-3">
        <span className="h-px w-6 bg-separator" />
        Это все {clients(TOTAL)}
        <span className="h-px w-6 bg-separator" />
      </p>
    ),
    [],
  );

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div className="flex h-14 items-center gap-2 border-b border-separator px-5">
        <h3 className="text-label-lg font-semibold text-fg-1">Клиенты</h3>
        <Badge>{TOTAL.toLocaleString('ru-RU')}</Badge>
        <span className="ml-auto text-body-sm text-fg-2">По алфавиту</span>
      </div>
      <VirtualList
        aria-label="Клиенты"
        className="h-[440px]"
        count={TOTAL}
        groups={groups}
        onRangeChange={load}
        footer={footer}
        renderRow={(index) => {
          const client = loaded.get(index);
          if (!client) return null;
          return (
            <div className="flex h-full items-center gap-3 border-b border-separator px-5 hover:bg-fill-2">
              <Avatar name={client.name.replace(/[«»]/g, '')} size={32} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-md font-medium text-fg-1">{client.name}</span>
                <span className="truncate text-caption text-fg-3">{client.place}</span>
              </div>
              <span className="w-24 shrink-0 text-right text-body-sm text-fg-2">
                {client.deals} {dealWords[plural.select(client.deals)] ?? 'сделки'}
              </span>
              <span className="w-30 shrink-0 text-right text-label-md font-medium text-fg-1 tabular-nums">{client.sum.toLocaleString('ru-RU')} ₽</span>
            </div>
          );
        }}
      />
    </div>
  );
}
