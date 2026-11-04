import { useRender } from '@base-ui/react/use-render';
import { Check, ChevronLeft, ChevronRight, CircleAlert, Eye, History, PanelLeft, PanelRight, Play, RotateCw, Sparkle, WifiOff, Zap } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactElement, type ReactNode, type RefObject } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { CountBadge } from './badge';
import type { BreadcrumbItem } from './breadcrumb';
import { Button, IconButton } from './button';
import { pluralRu } from './canvas-check';
import type { CanvasPerson } from './canvas-node';
import { Avatar, AvatarGroup } from './card';
import { Tooltip } from './popover';
import { Skeleton } from './progress';

/** Below this editor width the palette and the inspector open over the canvas, not beside it. */
const NARROW_EDITOR = 900;

export type CanvasSaveState = 'saved' | 'saving' | 'offline' | 'failed';

export interface CanvasEditorProps extends Omit<ComponentProps<'section'>, 'title' | 'children'> {
  /** Path to the graph, without the graph itself: «Автоматизации». */
  breadcrumbs: readonly BreadcrumbItem[];
  /** Graph name, the current crumb: «Заявка из Telegram → сделка». */
  title: string;
  /** Version chip: «Черновик · опубликована v7». */
  version?: string;
  /** Text of the saved state, announced politely: «сохранено только что». */
  saved?: string;
  /** offline and failed replace the text with a chip and switch «Запустить» and «Опубликовать» off. */
  saveState?: CanvasSaveState;
  /** «Повторить» next to «Не сохранено». */
  onRetrySave?: () => void;
  /** Problems that block publishing: «Опубликовать» shows the count and opens them via onValidate. */
  errors?: number;
  /** Who has the graph open: avatars 28, up to three and «+N». */
  people?: readonly Omit<CanvasPerson, 'editing'>[];
  onHistory?: () => void;
  onValidate?: () => void;
  onRun?: () => void;
  onPublish?: () => void;
  /** Extra header controls before «История». */
  actions?: ReactNode;
  /** Left zone 224: usually `<StepPalette>`. */
  palette?: ReactNode;
  /** Right zone 288: the inspector of the selection. */
  inspector?: ReactNode;
  paletteOpen?: boolean;
  /** Without it the palette is open on a wide editor and folded on a narrow one. */
  defaultPaletteOpen?: boolean;
  onPaletteOpenChange?: (open: boolean) => void;
  inspectorOpen?: boolean;
  defaultInspectorOpen?: boolean;
  onInspectorOpenChange?: (open: boolean) => void;
  /** The canvas; it takes all the width the zones leave. */
  children: ReactNode;
}

function ZoneToggle({
  label,
  open,
  icon,
  onToggle,
  ref,
}: {
  label: string;
  open: boolean;
  icon: ReactNode;
  onToggle: () => void;
  ref: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Tooltip content={open ? `Скрыть: ${label.toLowerCase()}` : `Показать: ${label.toLowerCase()}`}>
      <IconButton ref={ref} aria-label={label} aria-pressed={open} size="sm" icon={icon} onClick={onToggle} />
    </Tooltip>
  );
}

function Zone({
  label,
  side,
  overlay,
  toggle,
  onClose,
  children,
}: {
  label: string;
  side: 'left' | 'right';
  overlay: boolean;
  toggle: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  // opened from its toggle over the canvas: take the focus so Tab and Esc start here
  useLayoutEffect(() => {
    if (overlay && document.activeElement === toggle.current) ref.current?.focus();
  }, [overlay, toggle]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // portalled popups of the zone bubble here through React: only Esc from the zone itself closes it
    if (!overlay || event.key !== 'Escape' || event.defaultPrevented || !event.currentTarget.contains(event.target as Node)) return;
    event.stopPropagation();
    onClose();
    toggle.current?.focus();
  };

  return (
    <aside
      ref={ref}
      aria-label={label}
      data-overlay={overlay ? '' : undefined}
      tabIndex={overlay ? -1 : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        'flex shrink-0 flex-col overflow-y-auto bg-surface-1 outline-none',
        side === 'left' ? 'w-56 border-r border-separator' : 'w-72 border-l border-separator',
        overlay && cn('absolute inset-y-0 z-10 max-w-[calc(100%-48px)] shadow-overlay', side === 'left' ? 'left-0' : 'right-0'),
      )}
    >
      {children}
    </aside>
  );
}

function Crumb({ item, className, children, ...props }: { item: BreadcrumbItem; className: string; children: ReactNode; 'aria-label'?: string }) {
  return useRender({ defaultTagName: 'a', render: item.render, props: { href: item.href, className, children, ...props } });
}

/** A switched-off action keeps its place, its focus and a tooltip saying why. */
function Gate({ reason, children }: { reason: string | undefined; children: ReactElement }) {
  if (!reason) return children;
  return (
    <Tooltip content={reason}>
      <span className="inline-flex">{children}</span>
    </Tooltip>
  );
}

const crumbLink =
  'kv-pressable inline-flex h-6 min-w-0 items-center rounded-full px-1 text-fg-3 decoration-1 underline-offset-3 [--kv-press-scale:1] hover:text-fg-1 hover:underline active:bg-fill-2';
// Header steps, by the editor's own width: version → save text → «История» to an icon → avatars → check and run to icons.
const narrowHistory = '@max-[999px]:gap-0 @max-[999px]:px-2';
const narrowCheckRun = '@max-[829px]:gap-0 @max-[829px]:px-2';

/** Editor shell: header with path, version and actions over three zones — palette | canvas | inspector. */
export function CanvasEditor({
  breadcrumbs,
  title,
  version,
  saved,
  saveState = 'saved',
  onRetrySave,
  errors = 0,
  people,
  onHistory,
  onValidate,
  onRun,
  onPublish,
  actions,
  palette,
  inspector,
  paletteOpen,
  defaultPaletteOpen,
  onPaletteOpenChange,
  inspectorOpen,
  defaultInspectorOpen = true,
  onInspectorOpenChange,
  className,
  children,
  ...props
}: CanvasEditorProps) {
  const rootRef = useRef<HTMLElement>(null);
  const paletteToggle = useRef<HTMLButtonElement>(null);
  const inspectorToggle = useRef<HTMLButtonElement>(null);
  const reasonId = useId();
  const [narrow, setNarrow] = useState(false);
  // undefined: nobody chose yet, the width decides
  const [paletteChoice, setPaletteChoice] = useControllable<boolean | undefined>(paletteOpen, defaultPaletteOpen, (next) => {
    if (next !== undefined) onPaletteOpenChange?.(next);
  });
  const [showInspector, setShowInspector] = useControllable(inspectorOpen, defaultInspectorOpen, onInspectorOpenChange);
  const showPalette = paletteChoice ?? !narrow;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // 0 is a box that is not laid out (a hidden tab, jsdom): keep the wide layout
    const measure = () => setNarrow(root.clientWidth > 0 && root.clientWidth < NARROW_EDITOR);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const parent = breadcrumbs[breadcrumbs.length - 1];
  const blocked =
    saveState === 'offline'
      ? 'Нет сети: запуск и публикация вернутся вместе со связью'
      : saveState === 'failed'
        ? 'Правки не сохранены: сначала повторите сохранение'
        : undefined;
  const publishNote =
    blocked ?? (errors > 0 ? `${errors} ${pluralRu(errors, ['ошибка мешает', 'ошибки мешают', 'ошибок мешают'])} публиковать — откроется список проблем` : undefined);

  return (
    <section
      ref={rootRef}
      data-slot="canvas-editor"
      aria-label={title}
      className={cn('flex min-h-0 flex-col overflow-hidden bg-surface-1', className)}
      {...props}
    >
      {/* Wraps into two rows rather than letting anything overlap; the steps above keep one row down to ~650px. */}
      <header className="@container flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-separator py-2 pr-3 pl-4">
        <div className="flex min-w-0 grow basis-[300px] items-center gap-2">
          <nav aria-label="Путь" className="flex min-w-0 items-center text-body-sm">
            {parent ? (
              <Crumb
                item={parent}
                aria-label={`Назад: ${parent.label}`}
                className="kv-pressable -ml-2 grid size-8 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-fill-1 @min-[640px]:hidden [&_svg]:size-4 [&_svg]:stroke-[1.75]"
              >
                <ChevronLeft aria-hidden />
              </Crumb>
            ) : null}
            <ol className="flex min-w-0 items-center gap-1">
              {breadcrumbs.map((item) => (
                <li key={item.label} className="flex min-w-0 shrink-[100] items-center gap-1 @max-[639px]:hidden">
                  <Crumb item={item} className={crumbLink}>
                    <span className="max-w-40 truncate">{item.label}</span>
                  </Crumb>
                  <ChevronRight aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-4" />
                </li>
              ))}
              <li className="flex min-w-[120px] items-center px-1">
                <span aria-current="page" title={title} className="min-w-[120px] truncate font-semibold text-fg-1">
                  {title}
                </span>
              </li>
            </ol>
          </nav>
          {version ? (
            <span className="h-[22px] shrink-0 rounded-xs bg-fill-2 px-2 text-caption/[22px] font-medium whitespace-nowrap text-fg-2 @max-[1279px]:hidden">
              {version}
            </span>
          ) : null}
          <span
            role="status"
            className={cn('flex min-w-0 items-center text-caption whitespace-nowrap text-fg-3', (saveState === 'saved' || saveState === 'saving') && '@max-[1079px]:hidden')}
          >
            {saveState === 'offline' ? (
              <span className="flex h-6 min-w-0 items-center gap-1.5 rounded-xs bg-warning-soft px-2 font-medium text-warning-soft-fg">
                <WifiOff aria-hidden className="size-3 shrink-0 stroke-[2.5]" />
                <span className="truncate">Нет сети · правки ждут</span>
              </span>
            ) : saveState === 'failed' ? (
              <span className="flex h-6 min-w-0 items-center rounded-xs bg-danger-soft px-2 font-medium text-danger-soft-fg">
                <span className="truncate">Не сохранено</span>
              </span>
            ) : saveState === 'saving' ? (
              'сохраняем…'
            ) : (
              saved
            )}
          </span>
          {saveState === 'failed' && onRetrySave ? (
            <Button variant="ghost" size="sm" leadingIcon={<RotateCw />} className="bg-fill-2 hover:bg-fill-3 @min-[640px]:[&>svg]:hidden @max-[639px]:gap-0 @max-[639px]:px-2" onClick={onRetrySave}>
              <span className="@max-[639px]:sr-only">Повторить</span>
            </Button>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {people && people.length > 0 ? (
            <AvatarGroup max={3} size={28} className="-space-x-1.5! pr-2 @max-[899px]:hidden">
              {people.map((person) => (
                <Avatar
                  key={person.name}
                  name={person.name}
                  size={28}
                  className="text-fg-1!"
                  style={{ backgroundColor: `color-mix(in oklab, ${person.color} 22%, var(--color-surface-1))` }}
                />
              ))}
            </AvatarGroup>
          ) : null}
          {palette ? (
            <ZoneToggle ref={paletteToggle} label="Палитра шагов" open={showPalette} icon={<PanelLeft />} onToggle={() => setPaletteChoice(!showPalette)} />
          ) : null}
          {inspector ? (
            <ZoneToggle ref={inspectorToggle} label="Инспектор" open={showInspector} icon={<PanelRight />} onToggle={() => setShowInspector(!showInspector)} />
          ) : null}
          {actions}
          {onHistory ? (
            <Button variant="ghost" size="sm" leadingIcon={<History />} className={narrowHistory} onClick={onHistory}>
              <span className="@max-[999px]:sr-only">История</span>
            </Button>
          ) : null}
          {onValidate ? (
            <Button variant="ghost" size="sm" leadingIcon={<Check />} className={narrowCheckRun} onClick={onValidate}>
              <span className="@max-[829px]:sr-only">Проверить</span>
            </Button>
          ) : null}
          {onRun ? (
            <Gate reason={blocked}>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<Play className="fill-current" />}
                className={narrowCheckRun}
                disabled={blocked !== undefined}
                focusableWhenDisabled
                aria-describedby={blocked ? reasonId : undefined}
                onClick={onRun}
              >
                <span className="@max-[829px]:sr-only">Запустить</span>
              </Button>
            </Gate>
          ) : null}
          {onPublish ? (
            <Gate reason={blocked}>
              <Button
                variant="primary"
                size="sm"
                disabled={blocked !== undefined}
                focusableWhenDisabled
                aria-describedby={publishNote ? `${reasonId}-publish` : undefined}
                onClick={errors > 0 ? onValidate : onPublish}
              >
                Опубликовать
                {errors > 0 ? <CountBadge aria-hidden count={errors} className="ml-1.5 shadow-none" /> : null}
              </Button>
            </Gate>
          ) : null}
          <span id={reasonId} hidden>
            {blocked}
          </span>
          <span id={`${reasonId}-publish`} hidden>
            {publishNote}
          </span>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        {palette && showPalette ? (
          <Zone label="Палитра шагов" side="left" overlay={narrow} toggle={paletteToggle} onClose={() => setPaletteChoice(false)}>
            {palette}
          </Zone>
        ) : null}
        <div role="region" aria-label="Канвас" className="relative min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
        {inspector && showInspector ? (
          <Zone label="Инспектор" side="right" overlay={narrow} toggle={inspectorToggle} onClose={() => setShowInspector(false)}>
            {inspector}
          </Zone>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- Canvas states ---------- */

export type CanvasStateKind = 'empty' | 'loading' | 'error';

export interface CanvasStateProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  /** empty — the first step; loading — a skeleton of the saved layout; error — the graph did not open. */
  kind: CanvasStateKind;
  /** Overrides «Начните с триггера» / «Загружаем граф…» / «Граф не открылся». */
  title?: string;
  /** Overrides the line under the title. */
  description?: string;
  /** empty: «Добавить шаг» (Enter on the canvas does the same). */
  onAddStep?: () => void;
  /** empty: «Собрать с Нордой». */
  onBuildWithNorda?: () => void;
  /** error: «Повторить». */
  onRetry?: () => void;
  /** error: the version to fall back to, «v7» → «Открыть версию v7». */
  version?: string;
  onOpenVersion?: () => void;
}

const stateTile = 'grid size-11 shrink-0 place-items-center rounded-md [&_svg]:size-5 [&_svg]:stroke-2';

function SkeletonNode({ line, sub }: { line: string; sub: string }) {
  return (
    <div className="flex h-12 w-32 items-center gap-2 rounded-md bg-surface-1 px-3 shadow-[0_0_0_1px_var(--color-hairline)]">
      <Skeleton shape="rect" className="size-6 rounded-[7px]" />
      <div className="flex flex-col gap-[5px]">
        <Skeleton className={cn('h-2 rounded-[4px]', line)} />
        <Skeleton className={cn('h-1.5 rounded-[3px]', sub)} />
      </div>
    </div>
  );
}

/**
 * What the canvas shows while the graph is not there: empty, loading or failed to open.
 * No position of its own: it fills and centres in whatever holds it — the engine's empty slot or an overlay over the canvas.
 */
export function CanvasState({
  kind,
  title,
  description,
  onAddStep,
  onBuildWithNorda,
  onRetry,
  version,
  onOpenVersion,
  className,
  ...props
}: CanvasStateProps) {
  const shell = 'flex size-full flex-col items-center justify-center gap-4 p-6 text-center';

  if (kind === 'loading') {
    return (
      <div data-slot="canvas-state" data-kind={kind} role="status" aria-busy className={cn(shell, 'gap-0', className)} {...props}>
        <span className="sr-only">{title ?? 'Загружаем граф…'}</span>
        <SkeletonNode line="w-16" sub="w-10" />
        <span aria-hidden className="h-10 w-0.5 bg-fill-3" />
        <SkeletonNode line="w-14" sub="w-11" />
        <span aria-hidden className="h-10 w-0.5 bg-fill-3" />
        <SkeletonNode line="w-[70px]" sub="w-9" />
      </div>
    );
  }

  const error = kind === 'error';
  return (
    <div data-slot="canvas-state" data-kind={kind} role={error ? 'alert' : undefined} className={cn(shell, error && 'bg-surface-2', className)} {...props}>
      {error ? (
        <span aria-hidden className={cn(stateTile, 'bg-danger-soft text-danger-soft-fg')}>
          <CircleAlert />
        </span>
      ) : (
        <span
          aria-hidden
          className={cn(
            stateTile,
            'bg-surface-1 text-chart-5 shadow-[0_0_0_1px_var(--color-hairline),0_1px_2px_color-mix(in_oklab,var(--color-fg-1)_5%,transparent)]',
          )}
        >
          <Zap />
        </span>
      )}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-body-md font-semibold text-fg-1">{title ?? (error ? 'Граф не открылся' : 'Начните с триггера')}</h3>
        <p className={cn('text-body-xs text-fg-2', error ? 'max-w-[300px]' : 'max-w-[280px]')}>
          {description ?? (error ? 'Сервер не ответил. Ваши правки целы — они сохранены в черновике.' : 'Что запускает автоматизацию: сообщение, расписание или вебхук?')}
        </p>
      </div>
      {error ? (
        onRetry || onOpenVersion ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onRetry ? (
              <Button variant="outline" size="sm" className="bg-surface-1 px-3" onClick={onRetry}>
                Повторить
              </Button>
            ) : null}
            {onOpenVersion ? (
              <Button variant="link" size="sm" onClick={onOpenVersion}>
                {version ? `Открыть версию ${version}` : 'Открыть опубликованную версию'}
              </Button>
            ) : null}
          </div>
        ) : null
      ) : onAddStep || onBuildWithNorda ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onAddStep ? (
            <Button variant="outline" size="sm" className="bg-surface-1 pr-2.5 pl-3" onClick={onAddStep}>
              Добавить шаг
              <span aria-hidden className="ml-1.5 grid h-[18px] place-items-center rounded-[5px] bg-fill-2 px-[5px] font-mono text-[11px]/[14px] font-medium text-fg-3">
                ↵
              </span>
            </Button>
          ) : null}
          {onBuildWithNorda ? (
            <Button variant="soft" size="sm" leadingIcon={<Sparkle />} className="px-3 [&_svg]:size-3.5" onClick={onBuildWithNorda}>
              Собрать с Нордой
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface CanvasReadonlyBarProps extends ComponentProps<'div'> {
  /** «Попросить доступ»; without it the bar only says why nothing can be changed. */
  onRequestAccess?: () => void;
}

/** Plaque over the top of a read-only canvas: ports, palette and toolbars are hidden, view, search and comments stay. */
export function CanvasReadonlyBar({ onRequestAccess, className, children = 'Только просмотр', ...props }: CanvasReadonlyBarProps) {
  return (
    <div
      data-slot="canvas-readonly-bar"
      className={cn(
        'flex h-control-lg items-center justify-between gap-2 rounded-md bg-surface-1 pr-1.5 pl-3.5 shadow-[0_0_0_1px_var(--color-border)]',
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2 text-body-xs font-medium text-fg-1">
        <Eye aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-2" />
        <span className="truncate">{children}</span>
      </span>
      {onRequestAccess ? (
        <Button variant="ghost" size="sm" className="bg-fill-2 px-3 hover:bg-fill-3" onClick={onRequestAccess}>
          Попросить доступ
        </Button>
      ) : null}
    </div>
  );
}
