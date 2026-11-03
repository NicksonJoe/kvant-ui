import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prose } from '..';

function Article({ onClick }: { onClick?: () => void }) {
  return (
    <Prose onClick={onClick}>
      <h1>Как перенести клиентов из таблицы в Норду</h1>
      <p>Импорт занимает пару минут.</p>
      <h2>Подготовьте файл</h2>
      <p>
        Шаблон лежит на <a href="/import">странице импорта</a>, колонки: <code>name</code>.
      </p>
      <p>
        Импорт доступен на тарифах «Команда» и «Студия»
        <sup>
          <a href="#fn-1" id="fnref-1" data-footnote-ref>
            1
          </a>
        </sup>
        .
      </p>
      <section data-footnotes>
        <ol>
          <li id="fn-1">На тарифе «Старт» — до 500 строк за один импорт.</li>
        </ol>
      </section>
    </Prose>
  );
}

const classes = () => document.querySelector('[data-slot=prose]')?.className.split(' ') ?? [];

describe('Prose', () => {
  it('is a 680 column that styles plain HTML inside', () => {
    render(<Article />);
    const prose = document.querySelector('[data-slot=prose]');
    expect(prose?.tagName).toBe('DIV');
    expect(classes()).toContain('max-w-prose');
    expect(classes()).toContain('text-body-md/7');
    expect(classes()).toContain('text-fg-1');
  });

  it('takes another tag through render', () => {
    render(<Prose render={<article />}>Текст</Prose>);
    expect(screen.getByRole('article').getAttribute('data-slot')).toBe('prose');
  });

  it.each([
    ['h1 28/36 600, nothing above, 12 below', ['[&>h1]:text-heading-xl', '[&>h1]:font-semibold', '[&>h1+*]:mt-3']],
    ['lead 18/28 fg-2 right after h1', ['[&>h1+p]:text-body-lg', '[&>h1+p]:text-fg-2']],
    ['h2 20/28 600, 40 above, 12 below', ['[&>h2]:text-heading-md', '[&>h2]:mt-10', '[&>h2+*]:mt-3']],
    ['h3 16/24 600, 32 above, 8 below', ['[&>h3]:text-heading-xs', '[&>h3]:mt-8', '[&>h3+*]:mt-2']],
    ['paragraphs 16 apart', ['[&>*+*]:mt-4', '[&>:first-child]:mt-0']],
    ['lists: indent 24, step 8, dot 5 fg-3, number 500 tabular fg-3', ['[&_li]:pl-6', '[&_li+li]:mt-2', '[&>ul>li]:before:size-[5px]', '[&>ul>li]:before:bg-fg-3', '[&>ol>li]:before:font-medium', '[&>ol>li]:before:tabular-nums', '[&>ol>li]:before:text-fg-3']],
    ['quote 18/28, line 1 fg-4, indent 20, caption 13/18 fg-3', ['[&>blockquote]:border-l', '[&>blockquote]:border-fg-4', '[&>blockquote]:pl-5', '[&>blockquote]:text-body-lg', '[&_blockquote_footer]:text-body-xs', '[&_blockquote_footer]:text-fg-3']],
    ['inline code JetBrains Mono 14/20, fill-2, r 6, px 5', ['[&_:not(pre)>code]:font-mono', '[&_:not(pre)>code]:text-body-sm', '[&_:not(pre)>code]:bg-fill-2', '[&_:not(pre)>code]:rounded-xs', '[&_:not(pre)>code]:px-[5px]']],
    ['links accent-soft-fg, underline 1 offset 3, hover accent-hover in 75ms', ['[&_a]:text-accent-soft-fg', '[&_a]:underline', '[&_a]:underline-offset-3', '[&_a]:hover:text-accent-hover', '[&_a]:duration-(--duration-micro)']],
    ['footnotes 13/18 fg-3 under a 48 border line, number accent-soft-fg 500', ['[&>[data-footnotes]]:text-body-xs', '[&>[data-footnotes]]:text-fg-3', '[&>[data-footnotes]]:before:w-12', '[&>[data-footnotes]]:before:bg-border', '[&_[data-footnotes]_li]:before:text-accent-soft-fg']],
    ['hyphens in text only, headings never', ['hyphens-auto', '[&>:is(h1,h2,h3)]:hyphens-manual']],
  ] as const)('%s', (_name, expected) => {
    render(<Article />);
    for (const name of expected) expect(classes(), name).toContain(name);
  });
});

describe('Prose in-page links', () => {
  const scrollIntoView = vi.fn();
  const animate = vi.fn();
  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
    Element.prototype.animate = animate;
  });
  afterEach(() => {
    scrollIntoView.mockClear();
    animate.mockClear();
    document.documentElement.removeAttribute('data-reduce-motion');
  });

  it('scrolls smoothly to the footnote, focuses it and fades a fill-2 highlight over 1500ms', () => {
    render(<Article />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    screen.getByRole('link', { name: '1' }).dispatchEvent(event);
    const note = document.getElementById('fn-1');
    expect(event.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(scrollIntoView.mock.contexts[0]).toBe(note);
    expect(document.activeElement).toBe(note);
    expect(note?.getAttribute('tabindex')).toBe('-1');
    expect(animate).toHaveBeenCalledWith([{ backgroundColor: 'var(--color-fill-2)' }, { backgroundColor: 'transparent' }], { duration: 1500, easing: 'ease-out' });
  });

  it('jumps without the smooth scroll under reduced motion', () => {
    document.documentElement.setAttribute('data-reduce-motion', '');
    render(<Article />);
    fireEvent.click(screen.getByRole('link', { name: '1' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('leaves ordinary links to the browser and keeps the own onClick', () => {
    const own = vi.fn();
    render(<Article onClick={own} />);
    const away = new MouseEvent('click', { bubbles: true, cancelable: true });
    screen.getByRole('link', { name: 'странице импорта' }).dispatchEvent(away);
    expect(away.defaultPrevented).toBe(false);
    expect(own).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
