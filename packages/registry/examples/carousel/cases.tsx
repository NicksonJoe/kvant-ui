import { Carousel, CarouselSlide } from '@/kvant';

const cases = [
  { client: '«Студия Север» · 12 человек', title: 'Конверсия из заявки в договор выросла на 18 %', hue: 'var(--color-chart-1)' },
  { client: '«Орбита Лаб» · 30 человек', title: 'Сделки закрываются на 9 дней быстрее, чем в таблицах', hue: 'var(--color-chart-7)' },
  { client: 'Полюс · 8 человек', title: 'Счета и акты больше не теряются в переписке', hue: 'var(--color-chart-3)' },
  { client: 'Литера · 5 человек', title: 'Руководитель видит всю воронку в одном окне', hue: 'var(--color-chart-2)' },
  { client: 'Меридиан · 14 человек', title: 'Новые менеджеры выходят на план за две недели', hue: 'var(--color-chart-6)' },
];

export default function CarouselCases() {
  return (
    <Carousel aria-label="Кейсы клиентов" title="Кейсы клиентов" description="Как студии и агентства ведут сделки в Норде" className="w-full">
      {cases.map((item) => (
        <CarouselSlide key={item.client}>
          <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised">
            {/* abstract orbit art: soft rings around a solid planet */}
            <div aria-hidden className="relative aspect-video overflow-hidden" style={{ background: `color-mix(in oklab, ${item.hue} 14%, var(--color-surface-1))` }}>
              <span className="absolute -right-10 -bottom-16 size-64 rounded-full" style={{ background: `color-mix(in oklab, ${item.hue} 18%, transparent)` }} />
              <span className="absolute right-10 bottom-4 size-36 rounded-full" style={{ background: `color-mix(in oklab, ${item.hue} 26%, transparent)` }} />
              <span className="absolute right-[100px] bottom-[60px] size-12 rounded-full" style={{ background: item.hue }} />
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <p className="text-caption text-fg-3">{item.client}</p>
              <h3 className="text-heading-xs font-semibold text-fg-1">{item.title}</h3>
            </div>
          </article>
        </CarouselSlide>
      ))}
    </Carousel>
  );
}
