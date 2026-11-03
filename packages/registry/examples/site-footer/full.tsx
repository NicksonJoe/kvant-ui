import { Mail } from 'lucide-react';
import { useState } from 'react';
import { SiteFooter, SiteFooterLocale, SiteFooterSubscribe, type SiteFooterColumn, type SiteFooterSocial } from '@/kvant';

function Mark({ size }: { size: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" className="stroke-fg-1" strokeWidth="2" />
      <circle cx="18.36" cy="5.64" r="3.25" className="fill-accent stroke-background" strokeWidth="2" />
    </svg>
  );
}

const columns: readonly SiteFooterColumn[] = [
  {
    title: 'Продукт',
    links: [
      { label: 'Возможности', href: '#features' },
      { label: 'Тарифы', href: '#pricing' },
      { label: 'Интеграции', href: '#integrations' },
      { label: 'Агент Норды', href: '#agent' },
      { label: 'Что нового', href: '#changelog' },
    ],
  },
  {
    title: 'Клиентам',
    links: [
      { label: 'Документация', href: 'https://docs.norda.cloud', external: true },
      { label: 'Справка', href: '#help' },
      { label: 'API', href: '#api' },
      { label: 'Статус сервиса', href: '#status', status: { tone: 'success', label: 'всё работает' } },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О Норде', href: '#about' },
      { label: 'Блог', href: '#blog' },
      { label: 'Вакансии', href: '#jobs', count: 3 },
      { label: 'Контакты', href: '#contacts' },
    ],
  },
  {
    title: 'Документы',
    links: [
      { label: 'Оферта', href: '#offer' },
      { label: 'Конфиденциальность', href: '#privacy' },
      { label: 'Реквизиты', href: '#requisites' },
    ],
  },
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
  {
    label: 'Норда на YouTube',
    href: 'https://youtube.com/@norda',
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    ),
  },
  { label: 'Написать в Норду', href: 'mailto:hello@norda.cloud', icon: <Mail aria-hidden /> },
];

const languages = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export function NordaFooter() {
  const [language, setLanguage] = useState('ru');
  return (
    <SiteFooter
      logo={
        <a href="#top" className="flex items-center gap-2 rounded-xs text-[17px]/[22px] font-semibold tracking-[-0.01em] text-fg-1">
          <Mark size={24} />
          Норда
        </a>
      }
      description="CRM для студий и агентств: от первой заявки до закрывающих документов."
      subscribe={
        <SiteFooterSubscribe
          title="Письмо раз в месяц: что нового в Норде"
          note="Без рекламы. Отписаться — одна ссылка в письме."
          onSubscribe={() => new Promise((resolve) => setTimeout(resolve, 600))}
        />
      }
      columns={columns}
      legal="© 2026 Норда · Сделано в Санкт-Петербурге"
      social={social}
      locale={<SiteFooterLocale value={language} options={languages} onValueChange={setLanguage} />}
    />
  );
}

export default function SiteFooterFull() {
  // The footer folds by its own width: the frame keeps the desktop width and scrolls sideways when the window is narrower.
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <div className="min-w-[1312px]">
        <NordaFooter />
      </div>
    </div>
  );
}
