import type { ComponentProps, MouseEvent } from 'react';
import { Button } from '@/kvant';

// Stand-in for the router's <Link to>: it renders <a href> and navigates without a reload.
function Link({ to, onClick, ...props }: ComponentProps<'a'> & { to: string }) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey) event.preventDefault();
  };
  return <a {...props} href={to} onClick={navigate} />;
}

// The docs page stays put: a plain click is caught here, ⌘-click still opens a tab.
const stay = (event: MouseEvent) => {
  if (!event.metaKey && !event.ctrlKey) event.preventDefault();
};

const cases = [
  { code: '<Button onClick={create}>', result: '→ <button type="button"> · действие на этой странице', button: <Button>Создать сделку</Button> },
  {
    code: '<Button render={<a href="/deals/new" />}>',
    result: '→ <a href> · переход, ⌘-клик открывает вкладку',
    button: (
      <Button render={<a href="/deals/new" />} onClick={stay}>
        Создать сделку
      </Button>
    ),
  },
  {
    code: '<Button render={<Link to="/deals/new" />}>',
    result: '→ <a> роутера · переход без перезагрузки',
    button: <Button render={<Link to="/deals/new" />}>Создать сделку</Button>,
  },
];

export default function CompositionRender() {
  return (
    <div className="grid w-full gap-8 md:grid-cols-3">
      {cases.map((item) => (
        <div key={item.code} className="flex flex-col items-start gap-5 rounded-xl bg-surface-1 p-6 shadow-raised">
          {item.button}
          <div className="flex flex-col gap-1.5">
            <code className="font-mono text-overline font-medium break-words text-fg-1">{item.code}</code>
            <span className="text-caption text-fg-3">{item.result}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
