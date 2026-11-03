import { Marquee } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const names = ['Орбита Лаб', 'Студия Север', 'Квадрат', 'Полюс', 'Меридиан', 'Литера', 'Тайга Диджитал'];

const playground: Playground = {
  initial: { caption: 'Норде доверяют 1 200 студий и агентств' },
  render: (p) => (
    <Marquee caption={p.text('caption') || undefined} aria-label="Клиенты" duration={p.num('duration')} gap={p.num('gap')} fade={p.num('fade')}>
      {names.map((name) => (
        <span key={name} className="text-[19px]/6 font-semibold tracking-[-0.02em]">
          {name}
        </span>
      ))}
    </Marquee>
  ),
  code: (p) => `<Marquee${p.attrs(['caption', 'duration', 'gap', 'fade'])}>
  {logos}
</Marquee>`,
};

export default playground;
