import { SiteFooter, type SiteFooterLink, type SiteFooterSocial } from '@/kvant';

const links: readonly SiteFooterLink[] = [
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Документация', href: '#docs' },
  { label: 'Статус', href: '#status', status: { tone: 'success', label: 'всё работает' } },
  { label: 'Оферта', href: '#offer' },
  { label: 'Конфиденциальность', href: '#privacy' },
];

const social: readonly SiteFooterSocial[] = [
  {
    label: 'Норда в Telegram',
    href: 'https://t.me/norda',
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="fill-current">
        <path d="M21.9 4.3 18.6 19.9c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.9 13.5 1 12c-1.1-.3-1.1-1.1.2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.3Z" />
      </svg>
    ),
  },
  { label: 'Норда во ВКонтакте', href: 'https://vk.com/norda', icon: <span aria-hidden>VK</span> },
];

export default function SiteFooterCompact() {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <SiteFooter
        className="min-w-[1024px]"
        variant="compact"
        logo={
          <a href="#top" aria-label="Норда, на главную" className="flex rounded-xs">
            <svg aria-hidden width={20} height={20} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" className="stroke-fg-1" strokeWidth="2" />
              <circle cx="18.36" cy="5.64" r="3.25" className="fill-accent stroke-background" strokeWidth="2" />
            </svg>
          </a>
        }
        legal="© 2026 Норда"
        links={links}
        social={social}
      />
    </div>
  );
}
