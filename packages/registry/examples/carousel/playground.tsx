import { Carousel, CarouselSlide } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const slides = ['Воронка сделок', 'Клиенты', 'Счета и акты', 'Отчёты'];

const playground: Playground = {
  initial: { 'aria-label': 'Возможности', title: 'Возможности', description: 'Всё для работы со сделками' },
  render: (p) => (
    <Carousel
      aria-label={p.text('aria-label')}
      title={p.text('title') || undefined}
      description={p.text('description') || undefined}
      slideWidth={p.pick('slideWidth', [224, 320, 400] as const)}
      className="w-full"
    >
      {slides.map((name) => (
        <CarouselSlide key={name}>
          <div className="grid h-40 place-items-center rounded-xl bg-surface-1 text-heading-xs font-semibold shadow-raised">{name}</div>
        </CarouselSlide>
      ))}
    </Carousel>
  ),
  code: (p) => `<Carousel${p.attrs(['aria-label', 'title', 'description', 'slideWidth'])}>
  <CarouselSlide>…</CarouselSlide>
  <CarouselSlide>…</CarouselSlide>
</Carousel>`,
};

export default playground;
