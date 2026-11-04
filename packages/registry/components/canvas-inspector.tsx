import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { CircleAlert, MousePointer2, X } from 'lucide-react';
import { useId, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Badge, Kbd } from './badge';
import { portTypeName, pluralRu } from './canvas-check';
import type { CanvasPortType } from './canvas-types';

/* ---------- Shell ---------- */

export type InspectorTab = 'params' | 'data' | 'runs';

export type CanvasInspectorVariant = 'panel' | 'card';

export interface CanvasInspectorProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Step name: «Новое сообщение». */
  title: string;
  /** Kind, service and number: «Триггер · Telegram · шаг 1». */
  subtitle?: ReactNode;
  /** InspectorIcon of the step kind. */
  icon?: ReactNode;
  /** Shows ×; Esc in the editor does the same. */
  onClose?: () => void;
  /** panel — fills the inspector zone of CanvasEditor (288, separator and scroll come from the zone) · card — floating 312, r16 with a shadow. */
  variant?: CanvasInspectorVariant;
  /** Errors of this step that block publishing: a danger banner above the fields. */
  errors?: number;
  /** Fields of the step, top to bottom in the order people think about them. With it the inspector has tabs. */
  params?: ReactNode;
  /** Input and output of the last run. */
  data?: ReactNode;
  /** Runs of the step. */
  runs?: ReactNode;
  /** In the tab name: «Запуски 128», 0 — «Запусков нет». */
  runCount?: number;
  tab?: InspectorTab;
  defaultTab?: InspectorTab;
  onTabChange?: (tab: InspectorTab) => void;
}

const variants: Record<CanvasInspectorVariant, string> = {
  panel: 'w-full flex-1 bg-surface-1',
  card: 'w-[312px] max-w-full overflow-hidden rounded-lg bg-surface-1 shadow-raised',
};

const tabClass =
  'pt-2 pb-2.5 text-body-xs font-medium text-fg-3 outline-none transition-colors duration-(--duration-micro) ease-hover hover:text-fg-1 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-ring data-active:font-semibold data-active:text-fg-1';

/** Settings of the selected step: header, tabs «Параметры · Данные · Запуски», fields. Without `params` — a plain body. */
export function CanvasInspector({
  title,
  subtitle,
  icon,
  onClose,
  variant = 'panel',
  errors = 0,
  params,
  data,
  runs,
  runCount,
  tab,
  defaultTab = 'params',
  onTabChange,
  className,
  children,
  ...props
}: CanvasInspectorProps) {
  const titleId = useId();
  const [current, setCurrent] = useControllable<InspectorTab>(tab, defaultTab, onTabChange);
  const banner =
    errors > 0 ? (
      <p role="alert" className="flex items-center gap-2 rounded-[10px] bg-danger-soft px-3 py-2.5 text-body-xs font-medium text-danger-soft-fg">
        <CircleAlert aria-hidden className="size-4 shrink-0 fill-danger stroke-danger-fg stroke-[2.25]" />
        {`${errors} ${pluralRu(errors, ['ошибка мешает', 'ошибки мешают', 'ошибок мешают'])} публиковать`}
      </p>
    ) : null;
  const body = (content: ReactNode) => (
    <div className="flex flex-col gap-4 p-4">
      {banner}
      {content}
    </div>
  );

  return (
    <section data-slot="canvas-inspector" data-variant={variant} aria-labelledby={titleId} className={cn('flex flex-col', variants[variant], className)} {...props}>
      <header className={cn('flex items-center gap-2.5 pt-3.5 pr-3 pb-3 pl-4', params === undefined && 'border-b border-separator')}>
        {icon}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 id={titleId} className="truncate text-body-sm font-semibold text-fg-1">
            {title}
          </h2>
          {subtitle ? <p className="truncate text-caption text-fg-3">{subtitle}</p> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Закрыть инспектор"
            onClick={onClose}
            className="kv-pressable grid size-7 shrink-0 place-items-center rounded-sm text-fg-3 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3"
          >
            <X aria-hidden className="size-4 stroke-[1.75]" />
          </button>
        ) : null}
      </header>
      {params === undefined ? (
        body(children)
      ) : (
        <BaseTabs.Root value={current} onValueChange={(value: InspectorTab) => setCurrent(value)} className="flex flex-col">
          <BaseTabs.List className="relative flex gap-4 border-b border-separator px-4">
            <BaseTabs.Tab value="params" className={tabClass}>
              Параметры
            </BaseTabs.Tab>
            <BaseTabs.Tab value="data" className={tabClass}>
              Данные
            </BaseTabs.Tab>
            <BaseTabs.Tab value="runs" className={tabClass}>
              {runCount === 0 ? 'Запусков нет' : runCount === undefined ? 'Запуски' : `Запуски ${runCount}`}
            </BaseTabs.Tab>
            <BaseTabs.Indicator className="kv-slide absolute -bottom-px left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-fg-1" />
          </BaseTabs.List>
          <BaseTabs.Panel value="params" className="outline-none">
            {body(params)}
          </BaseTabs.Panel>
          <BaseTabs.Panel value="data" className="outline-none">
            {body(data ?? <p className="text-body-xs text-fg-3">Данные появятся после первого запуска.</p>)}
          </BaseTabs.Panel>
          <BaseTabs.Panel value="runs" className="outline-none">
            {body(runs ?? <p className="text-body-xs text-fg-3">Шаг ещё не запускался.</p>)}
          </BaseTabs.Panel>
        </BaseTabs.Root>
      )}
    </section>
  );
}

export interface InspectorIconProps extends Omit<ComponentProps<'span'>, 'color'> {
  /** Colour of the step kind: `var(--color-chart-4)` for logic, `var(--color-brand-telegram)`. */
  color: string;
  /** Brand tile: solid colour with a white glyph (Telegram); otherwise a 14 % tint. */
  solid?: boolean;
}

/** 28 tile of the step kind in the inspector header. */
export function InspectorIcon({ color, solid = false, className, style, ...props }: InspectorIconProps) {
  const tone: CSSProperties = solid ? { backgroundColor: color, color: 'var(--color-surface-1)' } : { backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`, color };
  return (
    <span
      aria-hidden
      data-slot="inspector-icon"
      className={cn('grid size-7 shrink-0 place-items-center rounded-sm [&_svg]:size-3.5 [&_svg]:stroke-2', className)}
      style={{ ...tone, ...style }}
      {...props}
    />
  );
}

/* ---------- Groups and lists ---------- */

export interface InspectorGroupProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** «Выходы», «Правила». */
  label: ReactNode;
  /** Accent text action on the right, after a «+»: «Поле», «Правило», «Класс». */
  actionLabel?: string;
  onAction?: () => void;
}

/** A labelled block of the inspector for lists: outputs, rules, branches, fields. Single controls go in Field. */
export function InspectorGroup({ label, actionLabel, onAction, className, children, ...props }: InspectorGroupProps) {
  return (
    <div data-slot="inspector-group" className={cn('flex flex-col gap-1.5', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-medium text-fg-2">{label}</span>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="rounded-xs text-caption font-medium text-accent hover:text-accent-hover active:text-accent-pressed">
            + {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Bordered list r10 with separators: rows of rules, branches, mapped fields. */
export function InspectorList({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="inspector-list" className={cn('flex flex-col divide-y divide-separator rounded-[10px] shadow-[inset_0_0_0_1px_var(--color-border)]', className)} {...props} />;
}

export function InspectorListItem({ className, ...props }: ComponentProps<'li'>) {
  return <li data-slot="inspector-list-item" className={cn('flex min-h-control-md items-center gap-2 px-3 py-1.5 text-body-xs text-fg-1', className)} {...props} />;
}

const roundTypes: ReadonlySet<CanvasPortType> = new Set(['number', 'boolean']);
const hollowTypes: ReadonlySet<CanvasPortType> = new Set(['object', 'list', 'tool', 'memory', 'knowledge']);

/** Port mark of a type: numbers round, the rest square; structures hollow. */
export function PortMark({ type, className }: { type: CanvasPortType; className?: string }) {
  return (
    <span
      aria-hidden
      data-slot="port-mark"
      data-type={type}
      className={cn(
        'size-2.5 shrink-0 border-2 border-fg-4',
        roundTypes.has(type) ? 'rounded-full' : 'rounded-[3px]',
        hollowTypes.has(type) ? 'bg-surface-1' : 'bg-fg-4 shadow-[inset_0_0_0_2px_var(--color-surface-1)]',
        className,
      )}
    />
  );
}

export interface InspectorOutput {
  /** Name the next steps use: `budget`, `сообщение.текст`. */
  name: string;
  type: CanvasPortType;
  /** Value from the last run: «120 000». */
  value?: ReactNode;
}

export interface InspectorOutputsProps extends ComponentProps<'ul'> {
  outputs: readonly InspectorOutput[];
}

/** Outputs of the step: port mark, mono name, type and the value of the last run. */
export function InspectorOutputs({ outputs, className, ...props }: InspectorOutputsProps) {
  return (
    <InspectorList className={className} {...props}>
      {outputs.map((output) => (
        <InspectorListItem key={output.name} className="h-control-md py-0">
          <PortMark type={output.type} />
          <span className="min-w-0 flex-1 truncate font-mono text-caption font-medium">{output.name}</span>
          <span className="w-14 shrink-0 text-right text-caption text-fg-3">{portTypeName(output.type)}</span>
          {output.value !== undefined ? <span className="w-20 shrink-0 truncate text-right text-caption font-medium tabular-nums">{output.value}</span> : null}
        </InspectorListItem>
      ))}
    </InspectorList>
  );
}

/** A variable of an earlier step: mono `{{заявка.task}}` on accent-soft. */
export function VariableChip({ path, className, ...props }: Omit<ComponentProps<'span'>, 'children'> & { path: string }) {
  return (
    <span
      data-slot="variable-chip"
      className={cn('inline-flex h-[22px] max-w-full items-center truncate rounded-xs bg-accent-soft px-1.5 font-mono text-overline font-medium text-accent-soft-fg', className)}
      {...props}
    >{`{{${path}}}`}</span>
  );
}

/** Surface-2 note under the fields: «Прошлый запуск — 3 мин назад» and what happened. */
export function InspectorNote({ title, className, children, ...props }: Omit<ComponentProps<'div'>, 'title'> & { title: ReactNode }) {
  return (
    <div data-slot="inspector-note" className={cn('flex flex-col gap-1 rounded-[10px] bg-surface-2 p-3', className)} {...props}>
      <p className="text-body-xs font-medium text-fg-1">{title}</p>
      {children ? <p className="text-caption text-fg-3">{children}</p> : null}
    </div>
  );
}

/* ---------- Instruction with variables ---------- */

export type InstructionPart = { type: 'text'; value: string } | { type: 'variable'; value: string; path: string };

/** Splits an instruction into text and `{{path}}` variables; an unclosed `{{` stays text. */
export function splitVariables(text: string): InstructionPart[] {
  const parts: InstructionPart[] = [];
  let last = 0;
  for (const match of text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    parts.push({ type: 'variable', value: match[0], path: match[1] ?? '' });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

export interface InstructionFieldProps extends Omit<ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Variables of earlier steps offered under the text; a click inserts one at the caret. */
  variables?: readonly string[];
  invalid?: boolean;
}

// The mirror and the textarea must wrap identically: same font, size, padding and break rules.
const textMetrics = 'px-3 py-2.5 font-sans text-[13px]/[19px] whitespace-pre-wrap break-words';

/** Instruction for the agent: plain text where `{{variables}}` light up as you type them. */
export function InstructionField({ value: valueProp, defaultValue = '', onValueChange, variables = [], invalid, className, ...props }: InstructionFieldProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const field = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();

  const insert = (path: string) => {
    const element = field.current;
    const token = `{{${path}}}`;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div
      data-slot="instruction-field"
      data-invalid={invalid || undefined}
      className={cn(
        'flex flex-col rounded-[10px] bg-field shadow-[inset_0_0_0_1px_var(--color-border)] transition-shadow duration-(--duration-fast) ease-hover focus-within:shadow-[inset_0_0_0_1.5px_var(--color-ring)] data-invalid:shadow-[inset_0_0_0_1.5px_var(--color-danger)]',
        className,
      )}
    >
      <div className="relative">
        <div aria-hidden className={cn(textMetrics, 'min-h-[76px] text-fg-1')}>
          {splitVariables(value).map((part, index) =>
            part.type === 'variable' ? (
              <mark key={index} data-slot="instruction-variable" className="rounded-[3px] bg-accent-soft text-accent-soft-fg">
                {part.value}
              </mark>
            ) : (
              <span key={index}>{part.value}</span>
            ),
          )}
          {/* keeps a trailing newline one line tall */}
          {'​'}
        </div>
        <textarea
          ref={field}
          value={value}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          onChange={(event) => setValue(event.target.value)}
          className={cn(textMetrics, 'absolute inset-0 resize-none overflow-hidden bg-transparent text-transparent caret-fg-1 outline-none placeholder:text-fg-3')}
          {...props}
        />
      </div>
      <div className="flex flex-col items-start gap-1 px-3 pb-2.5">
        <span id={hintId} className="text-caption text-fg-3">
          Переменные из прошлых шагов — набрать {'{{'}
        </span>
        {variables.length ? (
          <span className="flex flex-wrap gap-1">
            {variables.map((path) => (
              <button
                key={path}
                type="button"
                aria-label={`Вставить {{${path}}}`}
                onClick={() => insert(path)}
                className="rounded-xs font-mono text-overline font-medium text-accent-soft-fg hover:bg-accent-soft"
              >{`{{${path}}}`}</button>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Nothing selected ---------- */

export interface InspectorEmptyProps extends ComponentProps<'div'> {
  steps: number;
  edges: number;
  /** Warnings of the check: a warning badge, 0 hides the row. */
  warnings?: number;
}

/** Inspector with no step selected: a hint, the size of the graph and, as children, the version note. */
export function InspectorEmpty({ steps, edges, warnings = 0, className, children, ...props }: InspectorEmptyProps) {
  return (
    <div data-slot="inspector-empty" className={cn('flex flex-col gap-4', className)} {...props}>
      <div className="flex flex-col items-center gap-1.5 px-2 pt-5 pb-3 text-center">
        <span aria-hidden className="mb-1.5 grid size-10 place-items-center rounded-md bg-fill-2 text-fg-2">
          <MousePointer2 className="size-4.5 stroke-[1.75]" />
        </span>
        <p className="text-body-sm font-semibold text-fg-1">Выберите шаг</p>
        <p className="text-body-xs text-fg-2">Его настройки появятся здесь</p>
        <p className="flex items-center gap-1.5 pt-1 text-caption text-fg-3">
          Добавить шаг — <Kbd>Tab</Kbd>
        </p>
      </div>
      <InspectorGroup label="Граф">
        <InspectorList aria-label="Граф">
          <InspectorListItem className="justify-between">
            Шаги<span className="font-medium tabular-nums">{steps}</span>
          </InspectorListItem>
          <InspectorListItem className="justify-between">
            Связи<span className="font-medium tabular-nums">{edges}</span>
          </InspectorListItem>
          {warnings > 0 ? (
            <InspectorListItem className="justify-between">
              Предупреждения
              <Badge tone="warning">{warnings}</Badge>
            </InspectorListItem>
          ) : null}
        </InspectorList>
      </InspectorGroup>
      {children}
    </div>
  );
}
