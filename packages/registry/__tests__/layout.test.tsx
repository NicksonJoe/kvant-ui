import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container, Grid, GridItem, Section, Stack } from '..';

const classes = (element: Element | null) => (element?.getAttribute('class') ?? '').split(/\s+/);

describe('Stack', () => {
  it('a column with gap 16 by default', () => {
    render(<Stack data-testid="stack">Текст</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack.getAttribute('data-slot')).toBe('stack');
    expect(classes(stack)).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-4']));
  });

  it('row, gap from the spacing scale, alignment and wrap', () => {
    render(
      <Stack data-testid="stack" direction="row" gap={2} align="center" justify="between" wrap>
        Текст
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(classes(stack)).toEqual(expect.arrayContaining(['flex-row', 'gap-2', 'items-center', 'justify-between', 'flex-wrap']));
    expect(classes(stack)).not.toContain('flex-col');
  });

  it('renders as another tag', () => {
    render(
      <Stack render={<ul />} gap={0}>
        <li>Один</li>
      </Stack>,
    );
    expect(screen.getByRole('list').getAttribute('data-slot')).toBe('stack');
  });
});

describe('Grid', () => {
  it('4 columns on a phone, 8 on a tablet, 12 from 1024; gutter 16 → 24', () => {
    render(<Grid data-testid="grid" />);
    const grid = screen.getByTestId('grid');
    expect(grid.getAttribute('data-slot')).toBe('grid');
    expect(classes(grid)).toEqual(expect.arrayContaining(['grid', 'grid-cols-4', 'gap-4', 'md:grid-cols-8', 'md:gap-6', 'lg:grid-cols-12']));
  });
});

describe('GridItem', () => {
  const column = (element: HTMLElement, key: string) => element.style.getPropertyValue(key);

  it('takes the whole row by default', () => {
    render(<GridItem data-testid="item" />);
    const item = screen.getByTestId('item');
    expect(item.getAttribute('data-slot')).toBe('grid-item');
    expect(column(item, '--kv-col')).toBe('1 / -1');
    expect(column(item, '--kv-col-lg')).toBe('1 / -1');
  });

  it('a number spans that many columns on every screen', () => {
    render(<GridItem data-testid="item" span={2} />);
    const item = screen.getByTestId('item');
    expect(column(item, '--kv-col')).toBe('span 2');
    expect(column(item, '--kv-col-xl')).toBe('span 2');
  });

  it('per breakpoint: each step inherits the one below it', () => {
    render(<GridItem data-testid="item" span={{ base: 2, md: 4, lg: 7 }} />);
    const item = screen.getByTestId('item');
    expect(column(item, '--kv-col')).toBe('span 2');
    expect(column(item, '--kv-col-sm')).toBe('span 2');
    expect(column(item, '--kv-col-md')).toBe('span 4');
    expect(column(item, '--kv-col-lg')).toBe('span 7');
    expect(column(item, '--kv-col-xl')).toBe('span 7');
    expect(classes(item)).toEqual(expect.arrayContaining(['col-(--kv-col)', 'md:col-(--kv-col-md)', 'lg:col-(--kv-col-lg)']));
  });

  it('full stays full from a given step on', () => {
    render(<GridItem data-testid="item" span={{ base: 'full', lg: 4 }} />);
    const item = screen.getByTestId('item');
    expect(column(item, '--kv-col-md')).toBe('1 / -1');
    expect(column(item, '--kv-col-lg')).toBe('span 4');
  });
});

describe('Container', () => {
  it('1200 wide by default, centred, with margins 16 → 24 → 32 outside the width', () => {
    render(<Container data-testid="container" />);
    const container = screen.getByTestId('container');
    expect(container.getAttribute('data-slot')).toBe('container');
    expect(container.getAttribute('data-size')).toBe('lg');
    expect(classes(container)).toEqual(expect.arrayContaining(['mx-auto', 'box-content', 'max-w-(--container-lg)']));
  });

  it.each([
    ['prose', 'max-w-(--container-prose)'],
    ['md', 'max-w-(--container-md)'],
    ['xl', 'max-w-(--container-xl)'],
  ] as const)('size %s', (size, width) => {
    render(<Container data-testid="container" size={size} />);
    expect(classes(screen.getByTestId('container'))).toContain(width);
  });
});

describe('Section', () => {
  it('a full-width <section> with the content in a container, 48 above and below', () => {
    render(
      <Section aria-label="Возможности" data-testid="section">
        <p>Текст</p>
      </Section>,
    );
    const section = screen.getByRole('region', { name: 'Возможности' });
    expect(section.getAttribute('data-slot')).toBe('section');
    expect(classes(section)).toContain('py-12');
    expect(section.querySelector('[data-slot=container]')?.getAttribute('data-size')).toBe('lg');
  });

  it('landing 80, hero 96; container size or none', () => {
    const { rerender } = render(<Section data-testid="section" spacing="landing" container="md" />);
    expect(classes(screen.getByTestId('section'))).toContain('py-20');
    expect(screen.getByTestId('section').querySelector('[data-slot=container]')?.getAttribute('data-size')).toBe('md');
    rerender(<Section data-testid="section" spacing="hero" container={false} />);
    expect(classes(screen.getByTestId('section'))).toContain('py-24');
    expect(screen.getByTestId('section').querySelector('[data-slot=container]')).toBeNull();
  });
});
