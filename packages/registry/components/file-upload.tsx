import { CircleCheck, Clock, Download, FileSpreadsheet, FileText, FileX, Image as ImageIcon, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Progress } from './progress';

const UNITS = ['Б', 'КБ', 'МБ', 'ГБ'] as const;
const sizeNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const plural = new Intl.PluralRules('ru');

function sizeUnit(bytes: number): { divisor: number; unit: string } {
  let index = 0;
  while (bytes >= 1024 ** (index + 1) && index < UNITS.length - 1) index++;
  return { divisor: 1024 ** index, unit: UNITS[index] ?? 'Б' };
}

/** «512 Б», «1,2 МБ», «20 МБ». */
export function formatFileSize(bytes: number): string {
  const { divisor, unit } = sizeUnit(bytes);
  return `${sizeNumber.format(bytes / divisor)} ${unit}`;
}

/** «1 файл», «3 файла», «10 файлов». */
const filesWord = (n: number, genitive = false) => {
  const rule = plural.select(n);
  if (genitive) return rule === 'one' ? 'файла' : 'файлов';
  return rule === 'one' ? 'файл' : rule === 'few' ? 'файла' : 'файлов';
};

/** «PDF, PNG или JPG» from `.pdf,.png,.jpg`; `image/*` reads as «изображения». */
function typesLabel(tokens: readonly string[]): string {
  const names = tokens.map((token) => (token.endsWith('/*') ? 'изображения' : (token.split(/[./]/).at(-1) ?? token).toUpperCase()));
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} или ${names.at(-1)}` : (names[0] ?? '');
}

function matches(file: { name: string; type: string }, tokens: readonly string[]): boolean {
  return tokens.some((token) => {
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1));
    return file.type === token;
  });
}

export interface FileRejection {
  file: File;
  /** «Презентация.key» — нужен PDF, PNG или JPG. */
  reason: string;
}

export interface DropzoneProps {
  /** Same syntax as <input accept>: `.pdf,.png` or `image/*`. */
  accept?: string;
  /** Bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** Accepted files and the rejected ones with a reason, after a drop or a pick. */
  onFiles: (accepted: File[], rejected: FileRejection[]) => void;
  /** Replaces the hint built from accept, maxSize and maxFiles. */
  hint?: ReactNode;
  className?: string;
}

type Drag = { kind: 'accept'; count: number } | { kind: 'reject'; reason: string } | null;

/**
 * Drop files or press (Enter/Space) to pick them. The hint names formats and limits up front;
 * a refusal names the file and the reason. The upload itself is yours: list files with UploadItem.
 */
export function Dropzone({ accept, maxSize, maxFiles, multiple = true, disabled = false, onFiles, hint, className }: DropzoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [drag, setDrag] = useState<Drag>(null);
  const [refused, setRefused] = useState<FileRejection[]>([]);
  const tokens = (accept ?? '').split(',').map((token) => token.trim().toLowerCase()).filter(Boolean);
  const types = typesLabel(tokens);
  const limits = [
    types,
    maxSize ? `до ${formatFileSize(maxSize)}` : '',
    maxFiles && multiple ? `не больше ${maxFiles} ${filesWord(maxFiles, true)}` : '',
  ].filter(Boolean);

  const take = (files: File[]) => {
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    const limit = multiple ? (maxFiles ?? Infinity) : 1;
    for (const file of files) {
      const reason =
        tokens.length > 0 && !matches(file, tokens)
          ? `нужен ${types}`
          : maxSize !== undefined && file.size > maxSize
            ? `больше ${formatFileSize(maxSize)}`
            : accepted.length >= limit
              ? `можно не больше ${limit} ${filesWord(limit, true)}`
              : null;
      if (reason) rejected.push({ file, reason: `«${file.name}» — ${reason}` });
      else accepted.push(file);
    }
    setRefused(rejected);
    onFiles(accepted, rejected);
  };

  // While dragging only MIME types are known (no names), so refuse only what is certainly wrong.
  const inspect = (event: DragEvent<HTMLDivElement>): Drag => {
    const items = [...(event.dataTransfer?.items ?? [])].filter((item) => item.kind === 'file');
    const limit = multiple ? (maxFiles ?? Infinity) : 1;
    if (items.length > limit) return { kind: 'reject', reason: `Можно не больше ${limit} ${filesWord(limit, true)}` };
    const sure = tokens.length > 0 && tokens.every((token) => !token.startsWith('.'));
    if (sure && items.some((item) => item.type && !matches({ name: '', type: item.type }, tokens))) {
      return { kind: 'reject', reason: `Нужен ${types}` };
    }
    return { kind: 'accept', count: items.length || 1 };
  };

  const zone = disabled
    ? {}
    : {
        onClick: () => inputRef.current?.click(),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          inputRef.current?.click();
        },
        onDragEnter: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          depth.current += 1;
          setRefused([]);
          setDrag(inspect(event));
        },
        onDragOver: (event: DragEvent<HTMLDivElement>) => event.preventDefault(),
        onDragLeave: () => {
          depth.current = Math.max(depth.current - 1, 0);
          if (depth.current === 0) setDrag(null);
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          depth.current = 0;
          setDrag(null);
          take([...(event.dataTransfer?.files ?? [])]);
        },
      };

  const refusal = drag?.kind === 'reject' ? drag.reason : refused[0]?.reason;
  const state = drag?.kind ?? (refusal ? 'reject' : undefined);
  const title =
    drag?.kind === 'accept' ? (
      `Отпустите, чтобы загрузить ${drag.count} ${filesWord(drag.count)}`
    ) : refusal ? (
      refused.length > 1 ? 'Эти файлы не подойдут' : 'Этот файл не подойдёт'
    ) : (
      <>
        Перетащите файлы или <span className="text-accent-soft-fg decoration-1 underline-offset-3 group-hover/zone:underline">выберите на компьютере</span>
      </>
    );
  const Icon = state === 'accept' ? Download : state === 'reject' ? FileX : Upload;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-hint`}
      data-slot="dropzone"
      data-drag={drag?.kind}
      {...zone}
      className={cn(
        'group/zone flex cursor-default flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-input p-8 text-center transition-[border-color,background-color] duration-(--duration-fast) ease-hover select-none',
        'hover:border-fg-3 data-[drag=accept]:border-2 data-[drag=accept]:border-accent data-[drag=accept]:bg-accent-soft',
        state === 'reject' && 'border-2 border-danger bg-danger-soft hover:border-danger animate-[kv-shake_300ms_var(--ease-out)]',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          take([...(event.target.files ?? [])]);
          // Lets the same file be picked again after a refusal.
          event.target.value = '';
        }}
      />
      <span
        aria-hidden
        className={cn(
          'grid size-12 place-items-center rounded-full transition-[translate,background-color] [transition-duration:300ms] [transition-timing-function:var(--ease-spring-10)] [&_svg]:size-6 [&_svg]:stroke-[1.5]',
          state === 'accept' ? '-translate-y-1 bg-accent text-accent-fg' : state === 'reject' ? 'bg-danger text-danger-fg' : 'bg-accent-soft text-accent-soft-fg',
        )}
      >
        <Icon />
      </span>
      <span className="flex flex-col gap-1">
        <span
          id={`${id}-title`}
          className={cn('text-label-md font-medium', state === 'accept' ? 'text-accent-soft-fg' : state === 'reject' ? 'text-danger-soft-fg' : 'text-fg-1')}
        >
          {title}
        </span>
        <span id={`${id}-hint`} className={cn('text-caption', state === 'reject' ? 'text-danger-soft-fg' : 'text-fg-3')}>
          {refusal ?? (
            <>
              <span className="group-focus-visible/zone:hidden">{hint ?? limits.join(' · ')}</span>
              <span className="hidden group-focus-visible/zone:inline">Enter или пробел откроют выбор файлов</span>
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export function UploadList({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="upload-list" role="list" className={cn('flex flex-col', className)} {...props} />;
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItemProps {
  name: string;
  /** Bytes. */
  size: number;
  status: UploadStatus;
  /** 0–100 while uploading. */
  progress?: number;
  /** Added to the status line: «осталось 12 с», «загружен в 14:32». */
  meta?: ReactNode;
  /** Why the upload failed; the row stays and offers «Повторить». */
  error?: ReactNode;
  /** Image URL for the 40 px preview; otherwise an icon by file type. */
  preview?: string;
  onRetry?: () => void;
  /** × while queued or uploading, the bin once done. */
  onRemove?: () => void;
  className?: string;
}

function FileIcon({ name }: { name: string }) {
  if (/\.(png|jpe?g|gif|webp|avif|svg|heic)$/i.test(name)) return <ImageIcon aria-hidden />;
  if (/\.(xlsx?|csv|numbers|ods)$/i.test(name)) return <FileSpreadsheet aria-hidden />;
  return <FileText aria-hidden />;
}

const action =
  'kv-pressable grid size-7 shrink-0 place-items-center rounded-control-xs text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 active:bg-fill-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]';

/** One row of the upload list: queued → uploading (own progress bar) → done, or error with «Повторить». */
export function UploadItem({ name, size, status, progress = 0, meta, error, preview, onRetry, onRemove, className }: UploadItemProps) {
  const { divisor, unit } = sizeUnit(size);
  const line =
    status === 'queued'
      ? `${formatFileSize(size)} · в очереди`
      : status === 'uploading'
        ? `${sizeNumber.format((size * progress) / 100 / divisor)} из ${sizeNumber.format(size / divisor)} ${unit}`
        : formatFileSize(size);
  const removeLabel = status === 'uploading' ? `Отменить загрузку «${name}»` : status === 'done' ? `Удалить «${name}»` : `Убрать «${name}»`;

  return (
    <li
      data-slot="upload-item"
      data-status={status}
      className={cn('flex gap-3 pl-4 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-2 starting:opacity-0', className)}
    >
      <span className="flex shrink-0 items-center py-3">
        {preview ? (
          <img src={preview} alt="" className="size-10 rounded-md object-cover" />
        ) : (
          <span
            className={cn(
              'grid size-10 place-items-center rounded-md [&_svg]:size-5 [&_svg]:stroke-[1.5]',
              status === 'error' ? 'bg-danger-soft text-danger-soft-fg' : 'bg-surface-2 text-fg-2',
            )}
          >
            <FileIcon name={name} />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3 border-t border-separator py-3 pr-4">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-label-md font-medium text-fg-1">{name}</span>
          {status === 'error' ? (
            <span className="text-caption text-danger-soft-fg tabular-nums">{error ?? 'Не удалось загрузить'}</span>
          ) : (
            <span className="text-caption text-fg-3 tabular-nums">
              {line}
              {meta ? <> · {meta}</> : null}
            </span>
          )}
          {status === 'uploading' ? <Progress value={progress} size="sm" aria-label={`Загрузка «${name}»`} className="pt-1.5" /> : null}
        </span>
        <span className="flex shrink-0 items-center justify-end gap-2">
          {status === 'queued' ? <Clock role="img" aria-label="В очереди" className="size-4 stroke-[1.75] text-fg-3" /> : null}
          {status === 'uploading' ? <span className="text-label-sm font-medium text-fg-2 tabular-nums">{`${Math.round(progress)} %`}</span> : null}
          {status === 'done' ? (
            <CircleCheck
              role="img"
              aria-label="Загружен"
              className="size-4 stroke-[1.75] text-success transition-[scale] [transition-duration:300ms] [transition-timing-function:var(--ease-spring-10)] starting:scale-50"
            />
          ) : null}
          {status === 'error' && onRetry ? (
            <Button size="sm" variant="secondary" leadingIcon={<RotateCcw aria-hidden />} onClick={onRetry}>
              Повторить
            </Button>
          ) : null}
          {onRemove ? (
            <button type="button" aria-label={removeLabel} onClick={onRemove} className={action}>
              {status === 'done' ? <Trash2 aria-hidden /> : <X aria-hidden />}
            </button>
          ) : null}
        </span>
      </span>
    </li>
  );
}
