import { Slider as BaseSlider } from '@base-ui/react/slider';
import { Check, ChevronUp, Volume1, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  chapterAt,
  cycleRate,
  formatMediaTime,
  formatRate,
  formatRemaining,
  PauseGlyph,
  PlayGlyph,
  prefersReducedMotion,
  resamplePeaks,
  RingSpinner,
  seekByKey,
  SkipGlyph,
  stepRate,
  useMedia,
  useScrub,
  useWaveform,
  type Media,
  type MediaChapter,
  type MediaErrorReason,
} from '../lib/media';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from './menu';
import { Portal } from './portal';

export const AUDIO_PLAYER_VARIANTS = ['track', 'compact', 'voice', 'mini'] as const;
export type AudioPlayerVariant = (typeof AUDIO_PLAYER_VARIANTS)[number];
export const AUDIO_PLAYER_SIDES = ['incoming', 'outgoing'] as const;
export type AudioPlayerSide = (typeof AUDIO_PLAYER_SIDES)[number];

const TRACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const VOICE_RATES = [1, 1.5, 2] as const;

const REASONS: Record<MediaErrorReason, string> = {
  network: 'нет сети',
  format: 'формат не поддерживается',
  decode: 'файл повреждён',
  aborted: 'загрузка прервана',
  missing: 'файл не найден',
  forbidden: 'нет доступа',
};

type PlayerState = 'idle' | 'playing' | 'paused' | 'ended' | 'loading' | 'error' | 'disabled';

export interface AudioPlayerProps extends Omit<ComponentProps<'div'>, 'children' | 'title' | 'onEnded'> {
  src: string;
  variant?: AudioPlayerVariant;
  title?: ReactNode;
  /** Second line: «Подкаст Норды · 21 октября». Replaced by the reason while loading or after an error. */
  subtitle?: ReactNode;
  /** Square cover, usually an <img>: 56 in a track, 48 compact, 40 mini. */
  cover?: ReactNode;
  /** Chip after the title of a compact player that has not started: «Новый». */
  badge?: ReactNode;
  /** Buttons on the right of the track head: download, ⋯. */
  actions?: ReactNode;
  /** Track: the progress is cut into one segment per chapter. */
  chapters?: readonly MediaChapter[];
  /** Length in seconds before the metadata arrives: compact subtitle, voice bars. */
  duration?: number;
  /** Speeds offered; voice cycles through 1 → 1,5 → 2. */
  rates?: readonly number[];
  skipBack?: number;
  skipForward?: number;
  /** Voice: incoming on surface-2, outgoing on accent. */
  side?: AudioPlayerSide;
  /** Voice: not listened yet — fg-4 bars and an accent dot until it plays. */
  unplayed?: boolean;
  /** Voice: send time after the length: «14:02». */
  timestamp?: ReactNode;
  transcript?: ReactNode;
  /** Voice: speech-to-text is running. */
  transcribing?: boolean;
  /** Peaks 0–1 from the server; without them the file is decoded with Web Audio. */
  waveform?: readonly number[];
  /** Track: turns into a mini player at the bottom of the screen when the card scrolls away while playing. */
  sticky?: boolean;
  /** Forced error text, e.g. «Выпуск снят с публикации». */
  error?: ReactNode;
  disabled?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onEnded?: () => void;
  /** Mini: ⌃ opens the full player. */
  onExpand?: () => void;
  /** Mini: × stops and hides the bar. */
  onClose?: () => void;
}

const round = 'kv-pressable relative flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50';
const iconPress = '[--kv-press-scale:var(--scale-press-icon)]';
const ghost = cn(round, iconPress, 'text-fg-1 hover:bg-fill-1 active:bg-fill-2');

function stateOf(media: Media, disabled: boolean, error: ReactNode): PlayerState {
  if (disabled) return 'disabled';
  if (error || media.error) return 'error';
  if (media.loading) return 'loading';
  if (media.ended) return 'ended';
  if (!media.paused) return 'playing';
  return media.started ? 'paused' : 'idle';
}

/** Main button: play, pause, ring while buffering, retry after an error. */
function MainButton({
  state,
  media,
  size,
  icon,
  tone = 'accent',
  label = 'Слушать',
  className,
}: {
  state: PlayerState;
  media: Media;
  size: 36 | 44;
  icon: number;
  tone?: 'accent' | 'inverse';
  label?: string;
  className?: string;
}) {
  const names: Record<PlayerState, string> = {
    idle: label,
    paused: label,
    disabled: label,
    ended: 'Слушать снова',
    playing: 'Пауза',
    loading: 'Загрузка',
    error: 'Повторить',
  };
  const tones = {
    accent: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-pressed',
    inverse: 'bg-accent-fg text-accent hover:opacity-90',
  };
  return (
    <button
      type="button"
      data-slot="audio-player-button"
      aria-label={names[state]}
      aria-busy={state === 'loading' || undefined}
      disabled={state === 'disabled'}
      onClick={() => (state === 'error' ? media.retry() : media.toggle())}
      className={cn(
        round,
        iconPress,
        size === 44 ? 'size-control-lg' : 'size-control-md',
        state === 'error' ? 'bg-danger-soft text-danger-soft-fg' : tones[tone],
        className,
      )}
    >
      {state === 'loading' ? (
        <RingSpinner size={icon} />
      ) : state === 'error' ? (
        <RetryGlyph size={icon} />
      ) : state === 'playing' ? (
        <PauseGlyph size={icon} />
      ) : (
        <PlayGlyph size={icon} />
      )}
    </button>
  );
}

/** Retry arrow without digits. */
function RetryGlyph({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SkipButton({ media, seconds, direction, icon = 24, disabled }: { media: Media; seconds: number; direction: 'back' | 'forward'; icon?: number; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label={direction === 'back' ? `Назад на ${seconds} секунд` : `Вперёд на ${seconds} секунд`}
      disabled={disabled}
      onClick={() => media.skip(direction === 'back' ? -seconds : seconds)}
      className={cn(ghost, 'size-control-md')}
    >
      <SkipGlyph direction={direction} seconds={seconds} size={icon} />
    </button>
  );
}

function SpeedMenu({ media, rates, disabled, className }: { media: Media; rates: readonly number[]; disabled: boolean; className?: string }) {
  return (
    <Menu>
      <MenuTrigger
        aria-label="Скорость воспроизведения"
        disabled={disabled}
        className={cn(
          'kv-pressable flex h-7 shrink-0 items-center rounded-full bg-fill-2 px-2.5 font-semibold text-fg-1 tabular-nums outline-none hover:bg-fill-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
          className,
        )}
      >
        {formatRate(media.rate)}
      </MenuTrigger>
      <MenuContent side="top" align="start" className="min-w-36">
        <MenuRadioGroup value={media.rate} onValueChange={(value: number) => media.setRate(value)}>
          {rates.map((rate) => (
            <MenuRadioItem key={rate} value={rate} className="tabular-nums">
              {rate === 1 ? 'Обычная' : formatRate(rate)}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function Volume({ media, disabled }: { media: Media; disabled: boolean }) {
  const silent = media.muted || media.volume === 0;
  const Glyph = silent ? VolumeX : media.volume < 0.5 ? Volume1 : Volume2;
  return (
    <div data-slot="audio-player-volume" className="group/volume flex items-center gap-2">
      <button
        type="button"
        aria-label={silent ? 'Включить звук' : 'Выключить звук'}
        disabled={disabled}
        onClick={media.toggleMute}
        className={cn(round, iconPress, 'size-6 text-fg-2 hover:text-fg-1')}
      >
        <Glyph aria-hidden size={18} strokeWidth={1.75} />
      </button>
      <BaseSlider.Root
        value={silent ? 0 : Math.round(media.volume * 100)}
        min={0}
        max={100}
        step={5}
        disabled={disabled}
        onValueChange={(value: number) => media.setVolume(value / 100)}
        className="w-16"
      >
        <BaseSlider.Control className="relative flex h-6 w-full touch-none items-center select-none">
          <BaseSlider.Track className="relative h-1 w-full rounded-full bg-fill-3">
            <BaseSlider.Indicator className="rounded-full bg-fg-2" />
            <BaseSlider.Thumb
              aria-label="Громкость"
              getAriaValueText={(_formatted, value) => `${value} %`}
              className="size-3 rounded-full bg-surface-1 opacity-0 shadow-thumb outline-none transition-opacity duration-(--duration-fast) group-hover/volume:opacity-100 has-focus-visible:opacity-100 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

const valueText = (time: number, duration: number, chapters: readonly MediaChapter[]) => {
  const chapter = chapters[chapterAt(chapters, time)];
  return `${formatMediaTime(time)} из ${formatMediaTime(duration)}${chapter ? `, глава ${chapter.title}` : ''}`;
};

/** Position slider shared by the track and the compact card: chapters as segments with a 2 px cut. */
function Progress({
  media,
  duration,
  chapters,
  state,
  hint,
  className,
}: {
  media: Media;
  duration: number;
  chapters: readonly MediaChapter[];
  state: PlayerState;
  hint: boolean;
  className?: string;
}) {
  const scrub = useScrub({ duration, disabled: state === 'disabled' || state === 'error', onSeek: media.seek });
  const ratio = (value: number) => (duration > 0 ? Math.min(Math.max(value / duration, 0), 1) : 0);
  const parts = chapters.length ? chapters : [{ start: 0, title: '' }];
  const active = scrub.hover ?? (scrub.dragging ? media.time : null);
  const hovered = active === null ? -1 : Math.max(chapterAt(parts, active), 0);
  const hoverChapter = scrub.hover === null ? undefined : chapters[chapterAt(chapters, scrub.hover)];

  return (
    <div className={cn('relative', className)}>
      {hint && scrub.hover !== null ? (
        <span
          data-slot="audio-player-hint"
          aria-hidden
          className="pointer-events-none absolute bottom-full mb-1.5 flex h-6 -translate-x-1/2 items-center rounded-xs bg-fg-1 px-2 text-caption font-medium whitespace-nowrap text-surface-1 tabular-nums"
          style={{ left: `${ratio(scrub.hover) * 100}%` }}
        >
          {formatMediaTime(scrub.hover)}
          {hoverChapter ? ` · ${hoverChapter.title}` : ''}
        </span>
      ) : null}
      <div
        role="slider"
        tabIndex={state === 'disabled' ? -1 : 0}
        aria-label="Позиция"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(media.time)}
        aria-valuetext={valueText(media.time, duration, chapters)}
        aria-disabled={state === 'disabled' || undefined}
        data-slot="audio-player-progress"
        data-dragging={scrub.dragging || undefined}
        onKeyDown={(event) => {
          const time = seekByKey(event, { time: media.now(), duration, chapters, step: 5, largeStep: 15 });
          if (time === null) return;
          event.preventDefault();
          media.seek(time);
        }}
        {...scrub.handlers}
        className="group/progress relative flex h-6 touch-none items-center outline-none select-none"
      >
        {parts.map((chapter, index) => {
          const end = parts[index + 1]?.start ?? duration;
          const length = Math.max(end - chapter.start, 0);
          const fill = (value: number) => (length > 0 ? Math.min(Math.max((value - chapter.start) / length, 0), 1) * 100 : 0);
          const last = index === parts.length - 1;
          return (
            <span
              key={chapter.start}
              data-slot="audio-player-chapter"
              data-active={hovered === index || undefined}
              className={cn(
                'absolute h-1 overflow-hidden rounded-full bg-fill-2 transition-[height] duration-(--duration-fast) ease-out data-active:h-1.5',
                state === 'loading' && 'kv-shimmer',
                state === 'error' && 'opacity-50',
              )}
              style={{ left: `${ratio(chapter.start) * 100}%`, width: `calc(${ratio(length) * 100}% - ${last ? 0 : 2}px)` }}
            >
              <span data-slot="audio-player-buffer" className="absolute inset-y-0 left-0 bg-fill-3" style={{ width: `${fill(media.buffered)}%` }} />
              <span data-slot="audio-player-played" className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill(media.time)}%` }} />
            </span>
          );
        })}
        <span
          data-slot="audio-player-thumb"
          aria-hidden
          className="pointer-events-none absolute size-3 -translate-x-1/2 rounded-full bg-surface-1 opacity-0 shadow-[inset_0_0_0_2px_var(--color-accent),0_1px_3px_oklch(var(--ink)/0.2)] transition-opacity duration-(--duration-fast) group-hover/progress:opacity-100 group-focus-visible/progress:opacity-100 group-focus-visible/progress:outline-2 group-focus-visible/progress:outline-offset-2 group-focus-visible/progress:outline-ring group-data-dragging/progress:opacity-100"
          style={{ left: `${ratio(media.time) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Keys on the whole player: Space/K play and pause, < and > change the speed. */
function usePlayerKeys(media: Media, rates: readonly number[], disabled: boolean) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (disabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable=true]')) return;
    // Space on a button presses that button; on the slider or the card it toggles playback
    const onButton = target !== event.currentTarget && target.closest('button, a') !== null;
    const key = event.key.toLowerCase();
    if ((key === ' ' && !onButton) || key === 'k' || event.code === 'KeyK') {
      event.preventDefault();
      media.toggle();
    } else if (event.key === '>' || (event.code === 'Period' && event.shiftKey)) {
      event.preventDefault();
      media.setRate(stepRate(media.rateNow(), rates, 1));
    } else if (event.key === '<' || (event.code === 'Comma' && event.shiftKey)) {
      event.preventDefault();
      media.setRate(stepRate(media.rateNow(), rates, -1));
    }
  };
}

const coverClass = 'relative shrink-0 overflow-hidden bg-fill-2 [&>img]:size-full [&>img]:object-cover';

/** Second line: the reason while loading or after an error, otherwise the subtitle. */
function subtitleOf(state: PlayerState, error: ReactNode, reason: MediaErrorReason | null, fallback: ReactNode) {
  if (state === 'error') return error ?? `Не удалось загрузить · ${REASONS[reason ?? 'network']}`;
  if (state === 'loading') return 'Загружаем выпуск…';
  return fallback;
}

/* ---------- mini ---------- */

interface MiniProps {
  media: Media;
  state: PlayerState;
  title?: ReactNode;
  cover?: ReactNode;
  duration: number;
  rates: readonly number[];
  skipBack: number;
  skipForward: number;
  onExpand?: () => void;
  onClose?: () => void;
  /** Pinned to the bottom of the screen instead of sitting in the flow. */
  floating?: boolean;
  className?: string;
}

function Mini({ media, state, title, cover, duration, rates, skipBack, skipForward, onExpand, onClose, floating = false, className }: MiniProps) {
  const off = state === 'disabled' || state === 'error';
  return (
    <div
      data-slot="audio-player"
      data-variant="mini"
      data-state={state}
      onKeyDown={usePlayerKeys(media, rates, off)}
      className={cn(
        '@container flex h-16 items-center justify-between gap-4 overflow-hidden rounded-lg bg-glass-strong pr-4 pl-3 shadow-[0_0_0_1px_var(--color-hairline),0_8px_24px_-8px_oklch(var(--ink)/0.1)] backdrop-blur-[20px] backdrop-saturate-180',
        floating ? 'fixed inset-x-3 bottom-3' : 'relative',
        className,
      )}
    >
      <span aria-hidden data-slot="audio-player-line" className="absolute inset-x-0 top-0 h-0.5 bg-fill-2">
        <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${duration > 0 ? Math.min(media.time / duration, 1) * 100 : 0}%` }} />
      </span>
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-3">
        {cover ? <span data-slot="audio-player-cover" className={cn(coverClass, 'size-10 rounded-sm')}>{cover}</span> : null}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span data-slot="audio-player-title" className="truncate text-body-sm leading-5 font-semibold text-fg-1">
            {title}
          </span>
          <span data-slot="audio-player-subtitle" className={cn('truncate text-caption font-medium tabular-nums', state === 'error' ? 'text-danger-soft-fg' : 'text-fg-3')}>
            {subtitleOf(state, null, media.error, `${formatMediaTime(media.time)} · ${formatRemaining(duration - media.time)}`)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="contents @max-[520px]:hidden">
          <SkipButton media={media} seconds={skipBack} direction="back" icon={22} disabled={off} />
        </span>
        <MainButton state={state} media={media} size={44} icon={18} />
        <span className="contents @max-[520px]:hidden">
          <SkipButton media={media} seconds={skipForward} direction="forward" icon={22} disabled={off} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-1">
        <SpeedMenu media={media} rates={rates} disabled={off} className="text-caption @max-[420px]:hidden" />
        {onExpand ? (
          <button type="button" aria-label="Развернуть плеер" onClick={onExpand} className={cn(ghost, 'size-8 text-fg-2')}>
            <ChevronUp aria-hidden size={18} strokeWidth={1.75} />
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            aria-label="Закрыть плеер"
            onClick={() => {
              media.pause();
              onClose();
            }}
            className={cn(ghost, 'size-8 text-fg-2')}
          >
            <X aria-hidden size={18} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- voice ---------- */

/** 3 px bars with a 2 px gap; about one bar per 2.7 s, 20–48 bars. */
const barCount = (duration: number) => Math.min(Math.max(Math.round(14 + duration * 0.375), 20), 48);

function Waveform({ media, duration, peaks, side, unplayed, state }: { media: Media; duration: number; peaks: readonly number[]; side: AudioPlayerSide; unplayed: boolean; state: PlayerState }) {
  const scrub = useScrub({ duration, disabled: state === 'disabled', onSeek: media.seek });
  const progress = !media.ended && media.time > 0 && duration > 0 ? media.time / duration : null;
  const outgoing = side === 'outgoing';
  const idle = outgoing ? 'bg-accent-fg' : unplayed ? 'bg-fg-4' : 'bg-fg-2';
  return (
    <div
      role="slider"
      tabIndex={state === 'disabled' ? -1 : 0}
      aria-label="Позиция"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(media.time)}
      aria-valuetext={valueText(media.time, duration, [])}
      data-slot="audio-player-waveform"
      onKeyDown={(event) => {
        const time = seekByKey(event, { time: media.now(), duration, chapters: [], step: 5, largeStep: 15 });
        if (time === null) return;
        event.preventDefault();
        media.seek(time);
      }}
      {...scrub.handlers}
      className={cn(
        'flex h-[22px] cursor-pointer touch-none items-center gap-0.5 rounded-xs outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2',
        outgoing ? 'focus-visible:outline-accent-fg' : 'focus-visible:outline-ring',
      )}
    >
      {peaks.map((peak, index) => {
        const played = progress !== null && (index + 0.5) / peaks.length <= progress;
        const rest = outgoing ? 'bg-accent-fg/40' : 'bg-fg-4';
        return (
          <span
            key={index}
            data-slot="audio-player-bar"
            data-played={played || undefined}
            className={cn('w-[3px] shrink-0 rounded-full', progress === null ? idle : played ? (outgoing ? 'bg-accent-fg' : 'bg-accent') : rest)}
            style={{ height: `${4 + Math.round(peak * 16)}px` }}
          />
        );
      })}
    </div>
  );
}

function Voice({
  media,
  state,
  src,
  duration,
  side,
  unplayed,
  timestamp,
  transcript,
  transcribing,
  waveform,
  rates,
  className,
  rest,
}: {
  media: Media;
  state: PlayerState;
  src: string;
  duration: number;
  side: AudioPlayerSide;
  unplayed: boolean;
  timestamp?: ReactNode;
  transcript?: ReactNode;
  transcribing: boolean;
  waveform?: readonly number[];
  rates: readonly number[];
  className?: string;
  rest: ComponentProps<'div'>;
}) {
  const decoded = useWaveform(src, waveform);
  const [open, setOpen] = useState(true);
  const transcriptId = useId();
  const outgoing = side === 'outgoing';
  const bars = barCount(duration || 30);
  const fresh = unplayed && !media.started;
  const chip = media.started || media.rate !== 1;
  const muted = outgoing ? 'text-accent-fg' : 'text-fg-3';
  const shown = media.time > 0 || media.started;

  return (
    <div
      data-slot="audio-player"
      data-variant="voice"
      data-side={side}
      data-state={state}
      data-unplayed={fresh || undefined}
      data-disabled={state === 'disabled' || undefined}
      aria-busy={state === 'loading' || undefined}
      onKeyDown={usePlayerKeys(media, rates, state === 'disabled')}
      className={cn(
        'inline-flex max-w-full flex-col gap-2 rounded-xl py-2 pl-2 data-disabled:opacity-50',
        outgoing ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg-1',
        chip ? 'pr-2.5' : 'pr-3.5',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-2.5">
        {decoded === undefined ? (
          <>
            <span className="flex size-control-md shrink-0 items-center justify-center rounded-full bg-fill-2 text-fg-2">
              <RingSpinner size={20} />
            </span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="h-1 w-[178px] max-w-full rounded-full bg-fill-3" />
              <span className="h-2 w-12 rounded-[4px] bg-fill-2" />
            </span>
          </>
        ) : (
          <>
            <MainButton state={state} media={media} size={36} icon={16} tone={outgoing ? 'inverse' : 'accent'} label="Слушать голосовое" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <Waveform
                media={media}
                duration={Number.isFinite(media.duration) ? media.duration : duration}
                peaks={resamplePeaks(decoded ?? [], bars).map((peak) => (decoded ? peak : 0.35))}
                side={side}
                unplayed={fresh}
                state={state}
              />
              <div className="flex items-center gap-1.5">
                <span data-slot="audio-player-time" className={cn('text-caption font-medium tabular-nums', muted)}>
                  {state === 'error' ? 'Не удалось загрузить' : shown ? `${formatMediaTime(media.time)} / ${formatMediaTime(duration)}` : formatMediaTime(duration)}
                </span>
                {fresh ? <span data-slot="audio-player-dot" className="size-1.5 shrink-0 rounded-full bg-accent" /> : null}
                {timestamp ? <span className={cn('text-overline', muted)}>{timestamp}</span> : null}
              </div>
            </div>
          </>
        )}
        {chip ? (
          <button
            type="button"
            aria-label="Скорость воспроизведения"
            onClick={() => media.setRate(cycleRate(media.rate, rates))}
            className={cn(
              round,
              'h-7 px-2 text-caption font-semibold tabular-nums [--kv-press-scale:var(--scale-press)]',
              outgoing ? 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent-fg)_55%,transparent)] focus-visible:outline-accent-fg' : 'bg-fill-2 text-fg-1 hover:bg-fill-3',
            )}
          >
            {formatRate(media.rate)}
          </button>
        ) : null}
      </div>
      {transcribing ? (
        <div data-slot="audio-player-transcript" role="status" className="flex flex-col gap-1.5 pl-[46px]">
          <span className={cn('flex items-center gap-1.5 text-caption font-medium', outgoing ? 'text-accent-fg' : 'text-fg-2')}>
            <RingSpinner size={14} strokeWidth={5} />
            Расшифровываем…
          </span>
          <span aria-hidden className="h-2 w-[260px] max-w-full rounded-[4px] bg-fill-2" />
          <span aria-hidden className="h-2 w-[180px] max-w-full rounded-[4px] bg-fill-2" />
        </div>
      ) : transcript ? (
        <div data-slot="audio-player-transcript" className="flex flex-col items-start gap-1 pl-[46px]">
          {open ? (
            <p id={transcriptId} className="max-w-[46ch] text-body-sm leading-5">
              {transcript}
            </p>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? transcriptId : undefined}
            onClick={() => setOpen(!open)}
            className={cn(
              'rounded-xs text-caption font-medium outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2',
              outgoing ? 'text-accent-fg focus-visible:outline-accent-fg' : 'text-accent-soft-fg focus-visible:outline-ring',
            )}
          >
            {open ? 'Скрыть расшифровку' : 'Показать расшифровку'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- the player ---------- */

/**
 * Light player on the native <audio>: a podcast card with chapters, a compact row, a chat voice message
 * with its own waveform, and a mini bar. Only one Kvant player plays on the page at a time.
 */
export function AudioPlayer({
  src,
  variant = 'track',
  title,
  subtitle,
  cover,
  badge,
  actions,
  chapters = [],
  duration: knownDuration,
  rates,
  skipBack = 15,
  skipForward = 30,
  side = 'incoming',
  unplayed = false,
  timestamp,
  transcript,
  transcribing = false,
  waveform,
  sticky = false,
  error,
  disabled = false,
  preload = 'metadata',
  onEnded,
  onExpand,
  onClose,
  className,
  ...props
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const media = useMedia(audioRef, { chain: variant === 'voice' ? 'voice' : undefined, onEnded });
  const state = stateOf(media, disabled, error);
  const duration = Number.isFinite(media.duration) ? media.duration : (knownDuration ?? 0);
  const speeds = rates ?? (variant === 'voice' ? VOICE_RATES : TRACK_RATES);
  const off = state === 'disabled' || state === 'error';
  const onKeyDown = usePlayerKeys(media, speeds, state === 'disabled');

  const [away, setAway] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!sticky || !root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setAway(entry ? !entry.isIntersecting : false));
    observer.observe(root);
    return () => observer.disconnect();
  }, [sticky]);
  useEffect(() => {
    const element = audioRef.current;
    if (!sticky || !element) return;
    // playing again brings back a mini player closed earlier
    const show = () => setDismissed(false);
    element.addEventListener('play', show);
    return () => element.removeEventListener('play', show);
  }, [sticky]);

  const audio = <audio ref={audioRef} src={src || undefined} preload={preload} className="hidden" />;

  if (variant === 'voice') {
    return (
      <>
        <Voice
          media={media}
          state={state}
          src={src}
          duration={duration}
          side={side}
          unplayed={unplayed}
          timestamp={timestamp}
          transcript={transcript}
          transcribing={transcribing}
          waveform={waveform}
          rates={speeds}
          className={className}
          rest={props}
        />
        {audio}
      </>
    );
  }

  if (variant === 'mini') {
    return (
      <>
        <Mini
          media={media}
          state={state}
          title={title}
          cover={cover}
          duration={duration}
          rates={speeds}
          skipBack={skipBack}
          skipForward={skipForward}
          onExpand={onExpand}
          onClose={onClose}
          className={className}
        />
        {audio}
      </>
    );
  }

  const fresh = !media.started && state !== 'error' && state !== 'loading';

  if (variant === 'compact') {
    const line = media.started ? `${formatMediaTime(media.time)} · ${formatRemaining(duration - media.time)}` : duration > 0 ? (subtitle ? <>{subtitle} · {formatMediaTime(duration)}</> : formatMediaTime(duration)) : subtitle;
    return (
      <div
        ref={rootRef}
        data-slot="audio-player"
        data-variant="compact"
        data-state={state}
        data-disabled={state === 'disabled' || undefined}
        aria-busy={state === 'loading' || undefined}
        onKeyDown={onKeyDown}
        className={cn('flex flex-col gap-3.5 rounded-xl bg-surface-1 p-4 shadow-raised data-disabled:opacity-50', className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          {cover ? <span data-slot="audio-player-cover" className={cn(coverClass, 'size-12 rounded-[10px]')}>{cover}</span> : null}
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span data-slot="audio-player-title" className="truncate text-[15px] leading-5 font-semibold tracking-[-0.008em] text-fg-1">
                {title}
              </span>
              {badge && fresh ? (
                <span data-slot="audio-player-badge" className="flex h-[18px] shrink-0 items-center rounded-xs bg-accent-soft px-1.5 text-overline font-semibold text-accent-soft-fg">
                  {badge}
                </span>
              ) : null}
            </div>
            <span data-slot="audio-player-subtitle" className={cn('truncate text-body-xs font-medium tabular-nums', state === 'error' ? 'text-danger-soft-fg' : 'text-fg-3')}>
              {subtitleOf(state, error, media.error, line)}
            </span>
          </div>
          <MainButton state={state} media={media} size={44} icon={state === 'loading' || state === 'error' ? 18 : 16} />
        </div>
        <Progress media={media} duration={duration} chapters={chapters} state={state} hint={false} className="-my-2.5" />
        {audio}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-slot="audio-player"
      data-variant="track"
      data-state={state}
      data-disabled={state === 'disabled' || undefined}
      aria-busy={state === 'loading' || undefined}
      onKeyDown={onKeyDown}
      className={cn('@container flex flex-col gap-4 rounded-xl bg-surface-1 p-5 shadow-raised data-disabled:opacity-50', className)}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        {cover ? <span data-slot="audio-player-cover" className={cn(coverClass, 'size-14 rounded-md')}>{cover}</span> : null}
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <span data-slot="audio-player-title" className="truncate text-body-md leading-5 font-semibold tracking-[-0.008em] text-fg-1">
            {title}
          </span>
          <span data-slot="audio-player-subtitle" className={cn('truncate text-body-xs leading-4 font-medium', state === 'error' ? 'text-danger-soft-fg' : 'text-fg-3')}>
            {subtitleOf(state, error, media.error, subtitle)}
          </span>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
      </div>
      <div className="flex flex-col gap-1.5 pt-[30px]">
        <Progress media={media} duration={duration} chapters={chapters} state={state} hint className="-my-1.5" />
        <div className="flex justify-between text-caption font-medium tabular-nums">
          <span data-slot="audio-player-time" className="text-fg-2">
            {formatMediaTime(media.time)}
          </span>
          <span data-slot="audio-player-remaining" className="text-fg-3">
            {media.started ? `−${formatMediaTime(duration - media.time)}` : formatMediaTime(duration)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex w-24 shrink-0 @max-[400px]:w-auto">
          <SpeedMenu media={media} rates={speeds} disabled={off} className="text-body-xs" />
        </div>
        <div className="flex items-center gap-4">
          <SkipButton media={media} seconds={skipBack} direction="back" disabled={off} />
          <MainButton state={state} media={media} size={44} icon={20} className="shadow-[0_4px_12px_-2px_color-mix(in_oklab,var(--color-accent)_25%,transparent)]" />
          <SkipButton media={media} seconds={skipForward} direction="forward" disabled={off} />
        </div>
        <div className="flex w-24 shrink-0 justify-end @max-[400px]:w-auto">
          <span className="contents @max-[400px]:hidden">
            <Volume media={media} disabled={off} />
          </span>
        </div>
      </div>
      {audio}
      {sticky && away && media.started && !dismissed ? (
        <Portal layer="sticky">
          <Mini
            media={media}
            state={state}
            title={title}
            cover={cover}
            duration={duration}
            rates={speeds}
            skipBack={skipBack}
            skipForward={skipForward}
            onExpand={() => {
              rootRef.current?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
              rootRef.current?.querySelector<HTMLElement>('[data-slot=audio-player-button]')?.focus({ preventScroll: true });
            }}
            onClose={() => setDismissed(true)}
            floating
          />
        </Portal>
      ) : null}
    </div>
  );
}

/* ---------- playlist ---------- */

export interface AudioPlaylistItem {
  id: string;
  src: string;
  title: ReactNode;
  /** «28 октября». */
  subtitle?: ReactNode;
  /** Seconds, shown on the right before the file loads. */
  duration?: number;
  /** Listened to the end: fg-3 and a check. */
  played?: boolean;
  /** Taken down: .5 and a dash instead of the length. */
  disabled?: boolean;
}

export interface AudioPlaylistProps extends Omit<ComponentProps<'ol'>, 'children'> {
  items: readonly AudioPlaylistItem[];
  'aria-label': string;
  /** Plays the next row when one ends (default on). */
  autoAdvance?: boolean;
}

/** Bars of the current row: they follow the playhead while it plays and freeze on pause. */
function Equalizer({ time, playing }: { time: number; playing: boolean }) {
  const [still] = useState(prefersReducedMotion);
  const rest = [10, 16, 7, 12];
  return (
    <span aria-hidden className="flex h-4 items-end justify-center gap-0.5">
      {rest.map((height, index) => (
        <span
          key={index}
          className="w-[3px] rounded-[1px] bg-accent"
          style={{ height: `${playing && !still ? 4 + Math.round(12 * Math.abs(Math.sin(time * (5 + index * 1.7) + index))) : height}px` }}
        />
      ))}
    </span>
  );
}

/** Episodes in one list over one <audio>: Enter or a click plays a row, the next one follows by itself. */
export function AudioPlaylist({ items, autoAdvance = true, className, ...props }: AudioPlaylistProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [played, setPlayed] = useState<ReadonlySet<string>>(() => new Set(items.filter((item) => item.played).map((item) => item.id)));
  const pending = useRef(false);
  const index = items.findIndex((item) => item.id === current);
  const media = useMedia(audioRef, {
    onEnded: () => {
      if (!current) return;
      setPlayed((previous) => new Set(previous).add(current));
      const next = items.slice(index + 1).find((item) => !item.disabled);
      if (autoAdvance && next) {
        pending.current = true;
        setCurrent(next.id);
      }
    },
  });

  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    media.play();
  }, [current, media]);

  const choose = (item: AudioPlaylistItem) => {
    if (item.id === current) {
      media.toggle();
      return;
    }
    pending.current = true;
    setCurrent(item.id);
  };

  return (
    <>
      <ol data-slot="audio-playlist" className={cn('flex flex-col rounded-xl bg-surface-1 p-2 shadow-raised', className)} {...props}>
        {items.map((item, position) => {
          const isCurrent = item.id === current;
          const isPlayed = played.has(item.id) && !isCurrent;
          const length = isCurrent && Number.isFinite(media.duration) ? media.duration : item.duration;
          return (
            <li key={item.id}>
              <button
                type="button"
                data-slot="audio-playlist-row"
                aria-current={isCurrent || undefined}
                disabled={item.disabled}
                onClick={() => choose(item)}
                className={cn(
                  'group/row kv-pressable flex h-14 w-full items-center gap-3 rounded-md px-3 text-left outline-none [--kv-press-scale:1] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
                  isCurrent ? 'bg-accent-soft hover:bg-accent-soft-hover' : 'hover:bg-fill-1 active:bg-fill-2',
                )}
              >
                <span className="flex w-5 shrink-0 justify-center text-body-xs font-medium text-fg-3 tabular-nums">
                  {isCurrent ? (
                    <Equalizer time={media.time} playing={!media.paused} />
                  ) : isPlayed ? (
                    <Check aria-hidden size={16} strokeWidth={2} className="text-fg-4" />
                  ) : (
                    <>
                      <span data-slot="audio-playlist-index" className={cn(!item.disabled && 'group-hover/row:hidden group-focus-visible/row:hidden')}>
                        {position + 1}
                      </span>
                      <span aria-hidden className="hidden text-fg-1 group-hover/row:block group-focus-visible/row:block group-disabled/row:hidden">
                        <PlayGlyph size={16} />
                      </span>
                    </>
                  )}
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className={cn('truncate text-body-sm leading-5', isCurrent ? 'font-semibold text-accent-soft-fg' : isPlayed ? 'font-medium text-fg-3' : 'font-medium text-fg-1')}>
                    {item.title}
                  </span>
                  {isCurrent && length ? (
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="relative h-[3px] w-24 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-accent)_15%,transparent)]">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.min(media.time / length, 1) * 100}%` }} />
                      </span>
                      <span className="truncate text-caption font-medium text-accent-soft-fg tabular-nums">{formatRemaining(length - media.time)}</span>
                    </span>
                  ) : isPlayed ? (
                    <span className="text-caption font-medium text-fg-3">Прослушано</span>
                  ) : item.subtitle ? (
                    <span className="truncate text-caption font-medium text-fg-3">{item.subtitle}</span>
                  ) : null}
                </span>
                <span className={cn('w-12 shrink-0 text-right text-body-xs font-medium tabular-nums', isCurrent ? 'text-accent-soft-fg' : isPlayed ? 'text-fg-3' : 'text-fg-2')}>
                  {item.disabled ? '—' : length ? formatMediaTime(length) : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <audio ref={audioRef} src={items[index]?.src} preload="metadata" className="hidden" />
    </>
  );
}
