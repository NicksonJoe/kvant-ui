import { Button, Link, SkipLink } from '@/kvant';

const menu = ['Сделки', 'Клиенты', 'Задачи', 'Отчёты', 'Настройки'];

export default function VisuallyHiddenSkipLink() {
  return (
    <div className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <SkipLink href="#skip-link-main" />
      <header className="flex h-14 items-center gap-5 border-b border-separator px-5">
        <span className="text-label-md font-semibold text-fg-1">Норда</span>
        <nav aria-label="Разделы" className="flex gap-4">
          {menu.map((item) => (
            <Link key={item} href={`#${item}`} onClick={(event) => event.preventDefault()} className="text-label-md">
              {item}
            </Link>
          ))}
        </nav>
      </header>
      {/* On a real page this is <main id="main">; the docs page already has its own main. */}
      <section id="skip-link-main" aria-label="Сделки" className="flex flex-col items-start gap-3 p-5">
        <h3 className="text-heading-sm font-semibold text-fg-1">Сделки</h3>
        <p className="text-body-sm text-fg-2">Tab сначала показывает «Перейти к содержимому», Enter — и следующий Tab попадает сюда, мимо пяти пунктов меню.</p>
        <Button size="sm">Создать сделку</Button>
      </section>
    </div>
  );
}
