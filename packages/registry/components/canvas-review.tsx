import { ArrowRight, Check } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Button } from './button';
import { pluralRu, type CanvasGraphDiff, type CanvasProblem } from './canvas-check';

/* ---------- Check results ---------- */

export interface CanvasProblemsProps extends ComponentProps<'section'> {
  /** From checkGraph: errors first. */
  problems: readonly CanvasProblem[];
  /** «Показать»: bring the camera to `problem.nodeIds[0]` and select it. */
  onShow?: (problem: CanvasProblem) => void;
  /** Problems with a one-click fix get «Исправить» instead of «Показать». */
  canFix?: (problem: CanvasProblem) => boolean;
  onFix?: (problem: CanvasProblem) => void;
  /** «Опубликовать» in the header: disabled while errors remain, warnings do not block. */
  onPublish?: () => void;
  publishing?: boolean;
}

function ProblemMark({ severity }: { severity: CanvasProblem['severity'] }) {
  return (
    <span
      aria-hidden
      className={cn('grid size-5 shrink-0 place-items-center rounded-full text-[12px] leading-none font-bold', severity === 'error' ? 'bg-danger text-danger-fg' : 'bg-warning text-warning-fg')}
    >
      !
    </span>
  );
}

// the badges read as one sentence: «Нашлось 4 · 2 ошибки · 2 предупреждения»
const sep = <span className="sr-only"> · </span>;

/** Results of «Проверить»: what breaks a run, how to fix it, and a way to the step. */
export function CanvasProblems({ problems, onShow, canFix, onFix, onPublish, publishing = false, className, ...props }: CanvasProblemsProps) {
  const errors = problems.filter((problem) => problem.severity === 'error').length;
  const warnings = problems.length - errors;
  const summary = problems.length
    ? [
        `Нашлось ${problems.length}`,
        errors ? `${errors} ${pluralRu(errors, ['ошибка', 'ошибки', 'ошибок'])}` : null,
        warnings ? `${warnings} ${pluralRu(warnings, ['предупреждение', 'предупреждения', 'предупреждений'])}` : null,
      ]
    : ['Проблем нет'];
  return (
    <section data-slot="canvas-problems" aria-label="Проверка графа" className={cn('flex flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised', className)} {...props}>
      {/* wraps instead of overlapping in a narrow column such as the editor's inspector zone (288) */}
      <header className="flex min-h-control-xl shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-separator px-5 py-2">
        <p role="status" className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          {problems.length ? null : <Check aria-hidden className="size-4 shrink-0 stroke-[2.5] text-success" />}
          <span className="text-body-sm font-semibold text-fg-1">{summary[0]}</span>
          {errors ? <Badge tone="danger">{sep}{summary[1]}</Badge> : null}
          {warnings ? <Badge tone="warning">{sep}{summary[2]}</Badge> : null}
        </p>
        <span className="flex-1" />
        {onPublish ? (
          <span className="flex shrink-0 items-center gap-2">
            {errors ? <span className="text-caption text-fg-3">сначала ошибки</span> : null}
            <Button size="sm" disabled={errors > 0} loading={publishing} onClick={onPublish}>
              Опубликовать
            </Button>
          </span>
        ) : null}
      </header>
      {problems.length ? (
        <ul aria-label="Проблемы графа" className="flex flex-col divide-y divide-separator">
          {problems.map((problem) => {
            const fix = Boolean(onFix && canFix?.(problem));
            const act = fix ? onFix : onShow;
            return (
              <li key={problem.id} data-severity={problem.severity} className="flex items-start gap-3 px-5 py-3.5">
                <ProblemMark severity={problem.severity} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-body-sm font-medium text-fg-1">
                    <span className="sr-only">{problem.severity === 'error' ? 'Ошибка: ' : 'Предупреждение: '}</span>
                    {problem.title}
                  </p>
                  <p className="text-body-xs text-fg-2">{problem.description}</p>
                </div>
                {act ? (
                  <Button variant="link" size="sm" aria-label={`${fix ? 'Исправить' : 'Показать'}: ${problem.title}`} onClick={() => act(problem)} className="shrink-0">
                    {fix ? 'Исправить' : 'Показать'}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 py-6 text-center text-body-sm text-fg-3">Граф можно запускать и публиковать.</p>
      )}
    </section>
  );
}

/* ---------- Version comparison ---------- */

/** Rings for steps in a version comparison, for the node card: added success, changed warning, removed — a dashed ghost. */
export const CANVAS_DIFF_CLASSES = {
  added: 'shadow-[0_0_0_2px_var(--color-success),0_0_0_6px_color-mix(in_oklab,var(--color-success)_16%,transparent)]',
  changed: 'shadow-[0_0_0_2px_var(--color-warning),0_0_0_6px_color-mix(in_oklab,var(--color-warning)_16%,transparent)]',
  removed: 'bg-danger-soft opacity-80 outline-dashed outline-1 outline-danger [&_[data-slot=canvas-node-title]]:line-through',
} as const;

export interface CanvasVersionBarProps extends ComponentProps<'div'> {
  /** Older side: «v7 · 28 октября». */
  from: string;
  /** Newer side: «Черновик». */
  to: string;
  /** From diffGraphs: the legend counts steps. */
  diff?: CanvasGraphDiff;
  /** «Восстановить v7»; restoring also goes to history. */
  restoreLabel?: string;
  onRestore?: () => void;
}

/** Floating bar over the canvas while two versions are compared, with the +/~/− legend. */
export function CanvasVersionBar({ from, to, diff, restoreLabel = 'Восстановить', onRestore, className, ...props }: CanvasVersionBarProps) {
  const counts = diff ? { added: diff.nodes.added.length, changed: diff.nodes.changed.length, removed: diff.nodes.removed.length } : null;
  return (
    <div data-slot="canvas-version-bar" className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)} {...props}>
      <div
        role="group"
        aria-label={`Сравнение: ${from} → ${to}`}
        className="flex h-control-md items-center gap-2 rounded-[10px] bg-surface-1 pr-1.5 pl-3 shadow-[0_0_0_1px_var(--color-border),0_2px_8px_color-mix(in_oklab,var(--color-fg-1)_6%,transparent)]"
      >
        <span className="text-body-xs text-fg-2">{from}</span>
        <ArrowRight aria-hidden className="size-3.5 stroke-2 text-fg-3" />
        <span className="text-body-xs font-semibold text-fg-1">{to}</span>
        {onRestore ? (
          <Button variant="secondary" size="xs" onClick={onRestore}>
            {restoreLabel}
          </Button>
        ) : null}
      </div>
      {counts ? (
        <span aria-label={`добавлено ${counts.added}, изменено ${counts.changed}, удалено ${counts.removed}`} className="flex items-center gap-3.5 text-caption text-fg-2 tabular-nums">
          {(
            [
              ['bg-success', `+${counts.added}`],
              ['bg-warning', `~${counts.changed}`],
              ['bg-danger', `−${counts.removed}`],
            ] as const
          ).map(([tone, text]) => (
            <span key={tone} className="flex items-center gap-[5px]">
              <span aria-hidden className={cn('size-2 rounded-[2px]', tone)} />
              {text}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

export interface CanvasChangeNoteProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** What changed: «Инструкция агента». */
  title: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  /** «Вы · 4 мин назад». */
  meta?: ReactNode;
}

/** «Было / стало» next to a changed step; the engine places it in graph coordinates. */
export function CanvasChangeNote({ title, before, after, meta, className, ...props }: CanvasChangeNoteProps) {
  return (
    <div
      role="note"
      data-slot="canvas-change"
      className={cn('flex w-[200px] flex-col gap-1.5 rounded-md bg-overlay p-3 text-caption shadow-[0_0_0_1px_var(--color-border),0_12px_32px_color-mix(in_oklab,var(--color-fg-1)_12%,transparent)]', className)}
      {...props}
    >
      <p className="font-semibold text-fg-1">{title}</p>
      {before ? (
        <del className="text-danger-soft-fg decoration-1">
          <span className="sr-only">было: </span>
          {before}
        </del>
      ) : null}
      {after ? (
        <ins className="text-success-soft-fg no-underline">
          <span className="sr-only">стало: </span>
          {after}
        </ins>
      ) : null}
      {meta ? <p className="text-overline text-fg-3">{meta}</p> : null}
    </div>
  );
}

export interface CanvasVersion {
  id: string;
  /** «Версия 7», «Черновик». */
  label: string;
  date?: Date;
  /** «Опубликовала Ирина». */
  byline?: string;
  /** Extra line: «с тех пор 2 правки». */
  note?: string;
  /** The published version that runs now. */
  current?: boolean;
  /** Unpublished edits: cannot be restored, only compared. */
  draft?: boolean;
}

export interface CanvasVersionListProps extends Omit<ComponentProps<'ul'>, 'onSelect'> {
  versions: readonly CanvasVersion[];
  /** The version now compared with the draft on the canvas. */
  comparingId?: string;
  onCompare?: (id: string) => void;
  onRestore?: (id: string) => void;
}

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

/** Published versions with authors: compare any of them with the draft on the canvas or restore it. */
export function CanvasVersionList({ versions, comparingId, onCompare, onRestore, className, ...props }: CanvasVersionListProps) {
  return (
    <ul aria-label="Версии" data-slot="canvas-versions" className={cn('flex flex-col divide-y divide-separator rounded-[10px] shadow-[inset_0_0_0_1px_var(--color-border)]', className)} {...props}>
      {versions.map((version) => (
        <li key={version.id} className={cn('flex items-center gap-3 px-3 py-2.5', version.id === comparingId && 'bg-fill-1')}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex items-center gap-2 text-body-xs font-medium text-fg-1">
              {version.label}
              {version.current ? <Badge tone="success">работает</Badge> : null}
            </p>
            <p className="truncate text-caption text-fg-3">{[version.byline, version.date ? dayMonth.format(version.date) : null, version.note].filter(Boolean).join(' · ')}</p>
          </div>
          {onCompare && !version.draft ? (
            <Button variant="ghost" size="xs" aria-label={`Сравнить: ${version.label}`} aria-pressed={version.id === comparingId} onClick={() => onCompare(version.id)}>
              Сравнить
            </Button>
          ) : null}
          {onRestore && !version.draft ? (
            <Button variant="ghost" size="xs" aria-label={`Восстановить: ${version.label}`} onClick={() => onRestore(version.id)}>
              Восстановить
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
