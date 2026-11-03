import { useRef } from 'react';
import { BackToTop } from '@/kvant';

const steps = [
  ['Шаг 1. Выгрузите данные', 'Перед импортом выгрузите из старой системы три файла — контакты, сделки и пользователей. Норда принимает CSV и XLSX до 20 МБ.'],
  ['Шаг 2. Проверьте кодировку', 'Файлы из Excel сохраняйте в UTF-8, иначе кириллица превратится в знаки вопроса. Если не уверены — откройте файл в блокноте.'],
  ['Шаг 3. Загрузите файлы', 'Перетащите файлы в окно мастера или выберите их кнопкой. Каждый файл проверяется отдельно: ошибка в одном не мешает остальным.'],
  ['Шаг 4. Сопоставьте поля', 'Норда сама угадывает большинство колонок: «Телефон», «Почта», «Сумма». Если колонка не распознана, выберите поле вручную или пропустите её — данные не потеряются, их можно будет догрузить позже.'],
  ['Шаг 5. Проверьте дубли', 'Дубли по почте и телефону Норда покажет отдельным списком перед загрузкой. Выберите, какую карточку оставить, или объедините их.'],
  ['Шаг 6. Запустите импорт', 'Импорт идёт в фоне: можно закрыть мастер и продолжить работу. Когда он закончится, придёт уведомление со ссылкой на отчёт.'],
];

export default function BackToTopArticle() {
  const root = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);
  return (
    <div className="relative h-[460px] w-full max-w-[920px] overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div ref={root} className="h-full overflow-y-auto">
        <article className="flex max-w-[680px] flex-col gap-4 px-6 pt-10 pb-16 sm:px-24">
          <h1 className="text-heading-lg font-semibold text-fg-1">Импорт клиентов из другой CRM</h1>
          {steps.map(([title, text]) => (
            <section key={title} className="flex flex-col gap-3 pt-6">
              <h2 className="text-heading-sm font-semibold text-fg-1">{title}</h2>
              <p className="text-body-md/7 text-fg-2">{text}</p>
              <div aria-hidden className="h-40 rounded-lg bg-fill-1" />
            </section>
          ))}
        </article>
        <footer ref={footer} className="border-t border-separator px-6 py-8 text-label-sm text-fg-3 sm:px-24">
          © 2026 Норда · Справка
        </footer>
      </div>
      <BackToTop variant="progress" root={root} footer={footer} />
    </div>
  );
}
