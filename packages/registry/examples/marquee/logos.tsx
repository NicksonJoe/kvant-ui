import { Marquee } from '@/kvant';

// Client marks redrawn in one colour: currentColor, so the marquee paints them fg-3.
const logos = [
  <span key="orbita" className="flex items-center gap-2 text-[19px]/6 font-semibold tracking-[-0.02em]">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="3" fill="currentColor" stroke="var(--color-background)" strokeWidth="2" />
    </svg>
    Орбита Лаб
  </span>,
  <span key="sever" className="flex items-center gap-2.5 text-body-sm/6 font-semibold tracking-[0.14em]">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 4 21 19H3Z" fill="currentColor" />
    </svg>
    СТУДИЯ СЕВЕР
  </span>,
  <span key="kvadrat" className="flex items-center gap-2 text-[21px]/6 font-bold tracking-[-0.03em]">
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
    квадрат
  </span>,
  <span key="polus" className="flex items-center gap-2 text-[19px]/6 font-medium tracking-[-0.01em]">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
    Полюс
  </span>,
  <span key="meridian" className="flex items-center gap-2.5 text-body-sm/6 font-medium tracking-[0.22em]">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
    МЕРИДИАН
  </span>,
  <span key="litera" className="flex items-center gap-1.5 text-[22px]/6 font-semibold tracking-[-0.03em] italic">
    Литера
    <span aria-hidden className="size-1.5 rounded-full bg-current" />
  </span>,
  <span key="taiga" className="flex items-center gap-2 text-[17px]/6 font-semibold tracking-[-0.01em]">
    <svg width="24" height="22" viewBox="0 0 26 24" aria-hidden>
      <path d="M8 5 14 19H2Z" fill="currentColor" />
      <path d="M17 8 24 19H11Z" fill="currentColor" opacity="0.6" />
    </svg>
    Тайга Диджитал
  </span>,
  <span key="fokus" className="flex items-center gap-2 text-[19px]/6 font-semibold tracking-[-0.02em]">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
    фокус медиа
  </span>,
];

export default function MarqueeLogos() {
  return <Marquee caption="Норде доверяют 1 200 студий и агентств">{logos}</Marquee>;
}
