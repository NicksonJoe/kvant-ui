import type { ComponentProps, MouseEvent } from 'react';
import { Button } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const ELEMENTS = ['button', 'a', 'Link'] as const;

// Stand-in for the router's <Link to>.
function Link({ to, ...props }: ComponentProps<'a'> & { to: string }) {
  return <a {...props} href={to} />;
}

// The docs page stays put on a plain click.
const stay = (event: MouseEvent) => {
  if (!event.metaKey && !event.ctrlKey) event.preventDefault();
};

const renders = {
  button: undefined,
  a: <a href="/deals/new" />,
  Link: <Link to="/deals/new" />,
};

const codes = { button: '', a: ' render={<a href="/deals/new" />}', Link: ' render={<Link to="/deals/new" />}' };

const playground: Playground = {
  controls: [
    { name: 'element', type: 'enum', options: ELEMENTS, default: 'a', description: 'Итоговый тег: кнопка, ссылка или ссылка роутера.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна: у ссылки — aria-disabled, без href, фокус остаётся.' },
  ],
  render: (p) => {
    const element = p.pick('element', ELEMENTS);
    return (
      <Button render={renders[element]} disabled={p.bool('disabled')} onClick={stay}>
        Создать сделку
      </Button>
    );
  },
  code: (p) => `<Button${codes[p.pick('element', ELEMENTS)]}${p.attrs(['disabled'])}>Создать сделку</Button>`,
};

export default playground;
