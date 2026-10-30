import { FileText } from 'lucide-react';
import { Carousel, CarouselSlide } from '@/kvant';

const templates = ['Договор на дизайн', 'Счёт на предоплату', 'Акт выполненных работ', 'Коммерческое предложение', 'Бриф на сайт', 'Смета на анимацию'];

export default function CarouselTemplates() {
  return (
    <Carousel aria-label="Шаблоны документов" slideWidth={224} className="w-full max-w-2xl">
      {templates.map((name) => (
        <CarouselSlide key={name}>
          <div className="flex h-32 flex-col justify-between rounded-xl bg-surface-1 p-4 shadow-raised">
            <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent-soft-fg">
              <FileText aria-hidden className="size-4.5 stroke-[1.5]" />
            </span>
            <span className="text-label-md font-medium text-fg-1">{name}</span>
          </div>
        </CarouselSlide>
      ))}
    </Carousel>
  );
}
