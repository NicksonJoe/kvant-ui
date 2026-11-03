import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteFooter, SiteFooterLocale, SiteFooterSubscribe, type SiteFooterColumn, type SiteFooterSocial } from '..';

const columns: readonly SiteFooterColumn[] = [
  {
    title: 'Продукт',
    links: [
      { label: 'Возможности', href: '/features' },
      { label: 'Тарифы', href: '/pricing' },
    ],
  },
  {
    title: 'Клиентам',
    links: [
      { label: 'Документация', href: 'https://docs.norda.cloud', external: true },
      { label: 'Статус сервиса', href: '/status', status: { tone: 'success', label: 'всё работает' } },
    ],
  },
  { title: 'Компания', links: [{ label: 'Вакансии', href: '/jobs', count: 3 }] },
];

const social: readonly SiteFooterSocial[] = [
  { label: 'Норда в Telegram', href: 'https://t.me/norda', icon: <svg /> },
  { label: 'Норда во ВКонтакте', href: 'https://vk.com/norda', icon: <span>VK</span> },
];

const logo = (
  <a href="/" aria-label="Норда, на главную">
    Норда
  </a>
);

describe('SiteFooter', () => {
  it('full: <footer> with a «Подвал» navigation, columns as lists under h2', () => {
    render(<SiteFooter logo={logo} description="CRM для студий и агентств" columns={columns} legal="© 2026 Норда" social={social} />);
    const footer = document.querySelector('footer');
    expect(footer?.getAttribute('data-slot')).toBe('site-footer');
    expect(footer?.getAttribute('data-variant')).toBe('full');
    const nav = screen.getByRole('navigation', { name: 'Подвал' });
    const columnsBlock = nav.querySelector<HTMLElement>('[data-slot=site-footer-columns]');
    if (!columnsBlock) throw new Error('no columns');
    expect(within(columnsBlock).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Продукт', 'Клиентам', 'Компания']);
    const product = within(columnsBlock).getAllByRole('list')[0];
    if (!product) throw new Error('no list');
    expect(within(product).getAllByRole('link').map((item) => item.getAttribute('href'))).toEqual(['/features', '/pricing']);
    expect(screen.getByText('CRM для студий и агентств')).toBeDefined();
    expect(screen.getByText('© 2026 Норда')).toBeDefined();
  });

  it('external links open in a new tab and say so; status and count are part of the name', () => {
    render(<SiteFooter logo={logo} columns={columns} legal="©" />);
    const columnsBlock = document.querySelector<HTMLElement>('[data-slot=site-footer-columns]');
    if (!columnsBlock) throw new Error('no columns');
    const docs = within(columnsBlock).getByRole('link', { name: /Документация/ });
    expect(docs.getAttribute('target')).toBe('_blank');
    expect(docs.getAttribute('rel')).toBe('noopener noreferrer');
    expect(docs.textContent).toContain('откроется в новой вкладке');
    expect(within(columnsBlock).getByRole('link', { name: /Статус сервиса/ }).textContent).toContain('всё работает');
    expect(within(columnsBlock).getByRole('link', { name: /Вакансии/ }).querySelector('[data-slot=site-footer-count]')?.textContent).toBe('3');
  });

  it('social links are named by aria-label', () => {
    render(<SiteFooter logo={logo} columns={columns} legal="©" social={social} />);
    const link = screen.getByRole('link', { name: 'Норда в Telegram' });
    expect(link.getAttribute('href')).toBe('https://t.me/norda');
    expect(link.getAttribute('data-slot')).toBe('site-footer-social');
  });

  it('phone: the same columns as an accordion, one open at a time', () => {
    render(<SiteFooter logo={logo} columns={columns} legal="©" />);
    const accordion = document.querySelector<HTMLElement>('[data-slot=accordion]');
    if (!accordion) throw new Error('no accordion');
    const product = within(accordion).getByRole('button', { name: 'Продукт' });
    const clients = within(accordion).getByRole('button', { name: 'Клиентам' });
    expect(product.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(product);
    expect(product.getAttribute('aria-expanded')).toBe('true');
    expect(within(accordion).getByRole('link', { name: 'Тарифы' }).getAttribute('href')).toBe('/pricing');
    fireEvent.click(clients);
    expect(clients.getAttribute('aria-expanded')).toBe('true');
    expect(product.getAttribute('aria-expanded')).toBe('false');
  });

  it('compact: one row with the mark, the legal line and a few links, no columns', () => {
    render(
      <SiteFooter
        variant="compact"
        logo={logo}
        legal="© 2026 Норда"
        links={[
          { label: 'Тарифы', href: '/pricing' },
          { label: 'Статус', href: '/status', status: { tone: 'success', label: 'всё работает' } },
        ]}
        social={social}
      />,
    );
    expect(document.querySelector('footer')?.getAttribute('data-variant')).toBe('compact');
    const nav = screen.getByRole('navigation', { name: 'Подвал' });
    expect(within(nav).getAllByRole('link').map((item) => item.getAttribute('href'))).toEqual(['/pricing', '/status']);
    expect(document.querySelector('[data-slot=accordion]')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

describe('SiteFooterSubscribe', () => {
  const fill = (value: string) => fireEvent.change(screen.getByRole('textbox', { name: 'Рабочая почта' }), { target: { value } });

  it('sends the address and replaces the form with «Проверьте почту», focused', async () => {
    const onSubscribe = vi.fn(() => Promise.resolve());
    render(<SiteFooterSubscribe title="Письмо раз в месяц" note="Без рекламы." onSubscribe={onSubscribe} />);
    expect(screen.getByText('Без рекламы.')).toBeDefined();
    fill('anna@studio.ru');
    await act(async () => {
      fireEvent.submit(screen.getByRole('textbox', { name: 'Рабочая почта' }).closest('form') as HTMLFormElement);
    });
    expect(onSubscribe).toHaveBeenCalledWith('anna@studio.ru');
    const done = await screen.findByText('Проверьте почту');
    expect(document.activeElement).toBe(done.closest('[data-slot=site-footer-subscribe-done]'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('busy while sending; a failure keeps the form and says what happened', async () => {
    let fail: (reason: Error) => void = () => {};
    const onSubscribe = vi.fn(() => new Promise<void>((_resolve, reject) => (fail = reject)));
    render(<SiteFooterSubscribe title="Письмо раз в месяц" onSubscribe={onSubscribe} />);
    fill('anna@studio.ru');
    fireEvent.submit(screen.getByRole('textbox', { name: 'Рабочая почта' }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Подписаться' }).getAttribute('aria-busy')).toBe('true'));
    await act(async () => fail(new Error('network')));
    expect(screen.getByRole('alert').textContent).toBe('Не получилось подписаться. Попробуйте ещё раз.');
    expect(screen.getByRole('button', { name: 'Подписаться' }).hasAttribute('aria-busy')).toBe(false);
  });
});

describe('SiteFooterLocale', () => {
  it('shows the current language and picks another one from a menu', () => {
    const onValueChange = vi.fn();
    render(
      <SiteFooterLocale
        value="ru"
        options={[
          { value: 'ru', label: 'Русский' },
          { value: 'en', label: 'English' },
        ]}
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: /Русский/ });
    expect(trigger.getAttribute('aria-label')).toBe('Язык: Русский');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));
    expect(onValueChange).toHaveBeenCalledWith('en');
  });
});
