import { Link } from '@/kvant';

export default function LinkStandalone() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-4 rounded-xl bg-surface-1 p-5 shadow-raised">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-heading-xs font-semibold text-fg-1">Проекты</span>
        <span className="text-label-sm">
          <Link href="#projects">Все проекты</Link>
        </span>
      </div>
      <p className="text-body-sm text-fg-2">
        Перед стартом пришлите бриф: цели, сроки и бюджет помогут оценить работу точнее.
      </p>
      <span className="text-label-md">
        <Link href="https://norda.ru/help/brief" external>
          Как составить бриф
        </Link>
      </span>
    </div>
  );
}
