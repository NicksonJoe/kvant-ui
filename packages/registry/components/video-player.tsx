import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { Captions, Check, Download, Ellipsis, Maximize, Minimize, PictureInPicture2, RotateCcw, SlidersHorizontal, VideoOff, Volume1, Volume2, VolumeX } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../lib/cn';
import {
  chapterAt,
  formatMediaTime,
  formatRate,
  PauseGlyph,
  PlayGlyph,
  prefersReducedMotion,
  RingSpinner,
  seekByKey,
  SkipGlyph,
  stepRate,
  useMedia,
  useScrub,
  type Media,
  type MediaChapter,
  type MediaErrorReason,
} from '../lib/media';

const RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const HIDE_AFTER = 3000;
const HUD_FOR = 600;
const NEXT_IN = 5000;
/** Narrower than this the chrome turns into the phone layout. */
const NARROW = 480;

const REASONS: Record<MediaErrorReason, { text: string; action: 'retry' | 'download' | null }> = {
  network: { text: 'Проверьте соединение', action: 'retry' },
  format: { text: 'Браузер не может воспроизвести этот файл', action: 'download' },
  decode: { text: 'Файл повреждён', action: 'retry' },
  aborted: { text: 'Загрузка прервана', action: 'retry' },
  missing: { text: 'Файл не найден', action: null },
  forbidden: { text: 'Видео недоступно в вашем регионе', action: null },
};

export interface VideoPlayerTrack {
  src: string;
  /** «ru». */
  srclang: string;
  /** «Русские». */
  label: string;
  default?: boolean;
}

export interface VideoPlayerQuality {
  /** «720p». */
  label: string;
  src: string;
}

export interface VideoPlayerProps extends Omit<ComponentProps<'div'>, 'children' | 'title' | 'onEnded'> {
  src: string;
  /** Frame shown until the first press. */
  poster?: string;
  /** Over the poster, 16/20 600. */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Seconds, for the poster chip before the metadata arrives. */
  duration?: number;
  /** The hover preview names the chapter: «5:53 · Склад до перехода». */
  chapters?: readonly MediaChapter[];
  /** Subtitle files (WebVTT); C and the CC button turn them on. */
  tracks?: readonly VideoPlayerTrack[];
  /** Other sources of the same video for the settings menu; the playhead stays where it was. */
  qualities?: readonly VideoPlayerQuality[];
  rates?: readonly number[];
  /** Starts muted (browsers allow nothing else), never under reduced motion. */
  autoPlay?: boolean;
  loop?: boolean;
  /** A live stream: the red badge, the line to the edge, «К эфиру» when behind. */
  live?: boolean;
  /** Chip next to the live badge: «1 284 зрителя». */
  viewers?: ReactNode;
  /** Frames above the progress on hover, decoded by a second muted <video> (default on). */
  thumbnails?: boolean;
  /** Forced error text: «Видео недоступно в вашем регионе». */
  error?: ReactNode;
  /** After the end «Далее» counts 5 s down and calls it; any action cancels the count. */
  onNext?: () => void;
  /** No source yet: the start button is off. */
  disabled?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  onEnded?: () => void;
}

type VideoState = 'idle' | 'playing' | 'paused' | 'ended' | 'loading' | 'error' | 'disabled';

// Glass without its fill: bg-media-glass for the bar, bg-media-glass-strong for menus.
const frost =
  'backdrop-blur-[20px] backdrop-saturate-180 shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_0_0_1px_var(--color-media-hairline),0_12px_32px_-8px_oklch(0_0_0/0.6)]';
const glass = cn(frost, 'bg-media-glass');
const chromeBase =
  'kv-pressable relative flex shrink-0 items-center justify-center rounded-full text-media-fg-1 outline-none [--kv-press-scale:var(--scale-press-icon)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-media-fill-1 after:absolute after:bottom-[3px] after:left-1/2 after:hidden after:h-0.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-accent aria-pressed:after:block data-popup-open:bg-media-fill-2';
const chromeButton = cn(chromeBase, 'hover:bg-media-fill-1 active:bg-media-fill-2');
// White 18 % glass: hover 24 % and lift ×2 of --scale-lift (1.04, 1 under reduced motion), press 28 % and .94.
const startButton =
  'kv-pressable flex shrink-0 items-center justify-center rounded-full bg-[oklch(1_0_0/0.18)] text-media-fg-1 outline-none backdrop-blur-[20px] backdrop-saturate-180 shadow-[inset_0_1px_0_oklch(1_0_0/0.16),0_0_0_1px_oklch(1_0_0/0.14),0_12px_32px_-8px_oklch(0_0_0/0.4)] hover:scale-[calc(1+(var(--scale-lift)-1)*2)] hover:bg-[oklch(1_0_0/0.24)] active:scale-(--scale-press-icon) active:bg-[oklch(1_0_0/0.28)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-media-ring disabled:pointer-events-none disabled:opacity-40';
const pill = 'kv-pressable flex h-8 shrink-0 items-center gap-1.5 rounded-full font-medium text-media-fg-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring';

function stateOf(media: Media, disabled: boolean, error: ReactNode): VideoState {
  if (disabled) return 'disabled';
  if (error || media.error) return 'error';
  if (media.ended) return 'ended';
  if (media.loading) return 'loading';
  if (!media.paused) return 'playing';
  return media.started ? 'paused' : 'idle';
}

/** Chrome button with a tooltip that names its key: «Пауза (K)». Tooltips live inside the player, so they work in full screen. */
function ChromeButton({
  label,
  hint,
  container,
  plain = false,
  className,
  ...props
}: ComponentProps<'button'> & { label: string; hint?: string; container: RefObject<HTMLDivElement | null> | undefined; /** No fill of its own: the group around it lights up. */ plain?: boolean }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={<button type="button" />} aria-label={label} className={cn(plain ? chromeBase : chromeButton, className)} {...props} />
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner side="top" sideOffset={10} className="pointer-events-none z-50">
          <BaseTooltip.Popup className="kv-popup flex h-[22px] items-center rounded-xs bg-media-glass-strong px-2 text-caption font-semibold whitespace-nowrap text-media-fg-1 shadow-[0_0_0_1px_var(--color-media-hairline)] [--kv-enter-scale:var(--scale-tooltip)]">
            {hint ? `${label} (${hint})` : label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** Dark glass menu that opens above the bar; rendered inside the player for full screen. */
function MediaMenu({
  trigger,
  container,
  side = 'top',
  onOpenChange,
  children,
}: {
  trigger: ReactElement;
  /** The player in full screen (outside it nothing is shown), otherwise <body> so a small player does not clip the menu. */
  container: RefObject<HTMLDivElement | null> | undefined;
  side?: 'top' | 'bottom';
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  // 40 from the button row = 12 above the top edge of the bar, over the progress
  return (
    <BaseMenu.Root modal={false} onOpenChange={(open) => onOpenChange(open)}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner side={side} align="end" sideOffset={side === 'top' ? 40 : 4} collisionPadding={12} className="z-50 outline-none">
          <BaseMenu.Popup data-slot="video-player-menu" className={cn('kv-popup flex w-60 max-w-(--available-width) flex-col rounded-md p-1 text-media-fg-1 outline-none', frost, 'bg-media-glass-strong')}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function MenuChoices<Value extends number | string>({ label, value, options, onChange }: { label: string; value: Value; options: readonly { value: Value; label: string }[]; onChange: (value: Value) => void }) {
  return (
    <BaseMenu.RadioGroup value={value} onValueChange={(next: Value) => onChange(next)}>
      <BaseMenu.GroupLabel className="flex h-control-md shrink-0 items-center border-b border-media-hairline px-2 text-body-xs font-semibold">{label}</BaseMenu.GroupLabel>
      {options.map((option) => (
        <BaseMenu.RadioItem
          key={option.value}
          value={option.value}
          className="flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-body-xs font-medium tabular-nums outline-none select-none data-checked:font-semibold data-highlighted:bg-media-fill-1"
        >
          <span className="flex w-4 shrink-0">
            <BaseMenu.RadioItemIndicator>
              <Check aria-hidden size={16} strokeWidth={2} />
            </BaseMenu.RadioItemIndicator>
          </span>
          {option.label}
        </BaseMenu.RadioItem>
      ))}
    </BaseMenu.RadioGroup>
  );
}

/** Outside the component: the React compiler treats what a ref reaches as frozen. */
function setMode(track: TextTrack, mode: TextTrackMode) {
  track.mode = mode;
}

const rateOptions = (rates: readonly number[]) => rates.map((rate) => ({ value: rate, label: rate === 1 ? 'Обычная' : formatRate(rate) }));

/** Frame under the pointer from a second muted decoder: seeks to the hovered second, paints it at 144×81 once seeked. */
function Frame({ src, time, crossOrigin }: { src: string; time: number; crossOrigin?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLVideoElement | null>(null);
  const wanted = useRef(time);

  useEffect(() => {
    const probe = document.createElement('video');
    probe.muted = true;
    probe.preload = 'auto';
    if (crossOrigin) probe.crossOrigin = crossOrigin;
    probe.src = src;
    const paint = () => {
      canvasRef.current?.getContext('2d')?.drawImage(probe, 0, 0, 144, 81);
      // the pointer moved on while this frame decoded
      if (Math.abs(probe.currentTime - wanted.current) > 0.25) probe.currentTime = wanted.current;
    };
    const first = () => (probe.currentTime = wanted.current);
    probe.addEventListener('seeked', paint);
    probe.addEventListener('loadedmetadata', first, { once: true });
    probeRef.current = probe;
    return () => {
      probe.removeEventListener('seeked', paint);
      probe.removeAttribute('src');
      probeRef.current = null;
    };
  }, [src, crossOrigin]);

  useEffect(() => {
    wanted.current = time;
    const probe = probeRef.current;
    if (probe && probe.readyState >= 1 && !probe.seeking) probe.currentTime = time;
  }, [time]);

  return (
    <span className="relative block h-[81px] w-36 overflow-hidden rounded-sm bg-media-bg shadow-[0_0_0_1px_oklch(1_0_0/0.2),0_8px_24px_-6px_oklch(0_0_0/0.6)]">
      <canvas ref={canvasRef} width={144} height={81} className="size-full" />
    </span>
  );
}

/** Position slider of the chrome: 4 → 6 px on hover, buffer, ghost up to the pointer, 12 px knob, 16 while dragged. */
function Progress({
  media,
  duration,
  chapters,
  live,
  narrow,
  preview,
  src,
  crossOrigin,
}: {
  media: Media;
  duration: number;
  chapters: readonly MediaChapter[];
  live: boolean;
  narrow: boolean;
  preview: boolean;
  src: string;
  crossOrigin?: string;
}) {
  const scrub = useScrub({ duration, disabled: live, onSeek: media.seek });
  const ratio = (value: number) => (duration > 0 ? Math.min(Math.max(value / duration, 0), 1) * 100 : 0);
  const played = live ? 100 : ratio(media.time);
  const hover = scrub.hover;
  const chapter = hover === null ? undefined : chapters[chapterAt(chapters, hover)];
  const known = Number.isFinite(duration) && duration > 0;
  const nowChapter = chapters[chapterAt(chapters, media.time)];

  return (
    <div className={cn('relative', narrow ? 'h-3' : 'h-4', !known && !live && 'opacity-50')}>
      {hover !== null && !scrub.dragging && !narrow ? (
        <span
          className="pointer-events-none absolute bottom-[calc(100%+14px)] flex w-[170px] -translate-x-1/2 flex-col items-center gap-1.5"
          style={{ left: `clamp(73px, ${ratio(hover)}%, calc(100% - 73px))` }}
        >
          {preview ? <Frame src={src} time={hover} crossOrigin={crossOrigin} /> : null}
          <span
            data-slot="video-player-preview"
            className="flex h-[22px] items-center rounded-xs bg-media-glass-strong px-2 text-caption font-semibold whitespace-nowrap text-media-fg-1 tabular-nums shadow-[0_0_0_1px_var(--color-media-hairline)]"
          >
            {formatMediaTime(hover)}
            {chapter ? ` · ${chapter.title}` : ''}
          </span>
        </span>
      ) : null}
      <div
        role="slider"
        tabIndex={known ? 0 : -1}
        aria-label="Позиция"
        aria-valuemin={0}
        aria-valuemax={known ? Math.round(duration) : 0}
        aria-valuenow={Math.round(media.time)}
        aria-valuetext={live ? 'Прямой эфир' : `${formatMediaTime(media.time)} из ${formatMediaTime(duration)}${nowChapter ? `, глава ${nowChapter.title}` : ''}`}
        aria-disabled={!known || undefined}
        data-slot="video-player-progress"
        data-dragging={scrub.dragging || undefined}
        onKeyDown={(event) => {
          if (!known) return;
          const time = seekByKey(event, { time: media.now(), duration, chapters, step: 5, largeStep: 10 });
          if (time === null) return;
          event.preventDefault();
          media.seek(time);
        }}
        {...scrub.handlers}
        // the track is 24 high on desktop and 44 on a phone; the visible line stays 4–6
        className={cn('group/progress absolute inset-x-0 top-1/2 flex -translate-y-1/2 cursor-pointer touch-none items-center outline-none select-none', narrow ? 'h-11' : 'h-6')}
      >
        <span
          className={cn(
            'relative h-1 w-full overflow-hidden rounded-full bg-media-track transition-[height] duration-(--duration-fast) ease-out',
            !narrow && 'group-hover/progress:h-1.5 group-data-dragging/progress:h-1.5',
          )}
        >
          {!live ? <span data-slot="video-player-buffer" className="absolute inset-y-0 left-0 bg-media-buffer" style={{ width: `${ratio(media.buffered)}%` }} /> : null}
          {hover !== null && hover > media.time && !live ? (
            <span aria-hidden className="absolute inset-y-0 bg-media-ghost" style={{ left: `${played}%`, width: `${ratio(hover) - played}%` }} />
          ) : null}
          <span data-slot="video-player-played" className={cn('absolute inset-y-0 left-0 rounded-full', live ? 'bg-danger' : 'bg-accent')} style={{ width: `${played}%` }} />
        </span>
        {!live ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute flex size-3 -translate-x-1/2 items-end justify-center rounded-full bg-[oklch(1_0_0)] shadow-[0_1px_3px_oklch(0_0_0/0.4)] transition-[opacity,width,height] duration-(--duration-fast) ease-out',
              'group-focus-visible/progress:opacity-100 group-focus-visible/progress:outline-2 group-focus-visible/progress:outline-offset-2 group-focus-visible/progress:outline-media-ring group-data-dragging/progress:size-4 group-data-dragging/progress:opacity-100',
              narrow ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100',
            )}
            style={{ left: `${played}%` }}
          >
            {scrub.dragging ? (
              <span className="absolute bottom-[calc(100%+8px)] flex h-[22px] items-center rounded-xs bg-media-glass-strong px-2 text-caption font-semibold text-media-fg-1 tabular-nums shadow-[0_0_0_1px_var(--color-media-hairline)]">
                {formatMediaTime(media.time)}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function VolumeControl({ media, container }: { media: Media; container: RefObject<HTMLDivElement | null> | undefined }) {
  const silent = media.muted || media.volume === 0;
  const Glyph = silent ? VolumeX : media.volume < 0.5 ? Volume1 : Volume2;
  return (
    <div data-slot="video-player-volume" className="group/volume flex h-8 items-center gap-1.5 rounded-full transition-[background-color,padding] duration-(--duration-quick) ease-out focus-within:bg-media-fill-1 focus-within:pr-2.5 hover:bg-media-fill-1 hover:pr-2.5">
      <ChromeButton label={silent ? 'Включить звук' : 'Выключить звук'} hint="M" container={container} onClick={media.toggleMute} plain className="size-8">
        <Glyph aria-hidden size={18} strokeWidth={1.75} />
      </ChromeButton>
      <BaseSlider.Root
        value={silent ? 0 : Math.round(media.volume * 100)}
        min={0}
        max={100}
        step={5}
        onValueChange={(value: number) => media.setVolume(value / 100)}
        className="w-0 overflow-hidden transition-[width] duration-(--duration-quick) ease-out group-focus-within/volume:w-[72px] group-hover/volume:w-[72px]"
      >
        <BaseSlider.Control className="relative flex h-6 w-[72px] touch-none items-center px-1.5 select-none">
          <BaseSlider.Track className="relative h-1 w-full rounded-full bg-media-track">
            <BaseSlider.Indicator className="rounded-full bg-media-fg-1" />
            <BaseSlider.Thumb
              aria-label="Громкость"
              getAriaValueText={(_formatted, value) => `${value} %`}
              className="size-3 rounded-full bg-[oklch(1_0_0)] shadow-[0_1px_3px_oklch(0_0_0/0.4)] outline-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-media-ring"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

const KEYS: readonly (readonly [string, string])[] = [
  ['Space · K', 'Пауза и продолжение'],
  ['← →', '5 секунд назад и вперёд'],
  ['J L', '10 секунд назад и вперёд'],
  ['↑ ↓', 'Громкость на 5 %'],
  ['M', 'Звук'],
  ['F', 'Во весь экран'],
  ['C', 'Субтитры'],
  ['< >', 'Скорость'],
  ['Esc', 'Закрыть'],
];

/**
 * Dark player on the native <video>: a poster with one big button, then the chrome in one glass bar —
 * progress over the buttons, time on the left, settings on the right. Without movement the chrome leaves
 * a 2 px line after 3 s; below 480 px it becomes the phone layout with 44 px targets.
 */
export function VideoPlayer({
  src,
  poster,
  title,
  subtitle,
  duration: knownDuration,
  chapters = [],
  tracks = [],
  qualities,
  rates = RATES,
  autoPlay = false,
  loop = false,
  live = false,
  viewers,
  thumbnails = true,
  error,
  onNext,
  disabled = false,
  preload = 'metadata',
  crossOrigin,
  onEnded,
  className,
  onKeyDown,
  onPointerMove,
  onPointerDown,
  ...props
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [pipSupported] = useState(() => document.pictureInPictureEnabled === true);
  const autoplay = autoPlay && !reduced;

  const [next, setNext] = useState<{ deadline: number; now: number } | null>(null);
  const [nextCancelled, setNextCancelled] = useState(false);
  const media = useMedia(videoRef, {
    onEnded: () => {
      onEnded?.();
      setNextCancelled(false);
      if (onNext && !reduced) setNext({ deadline: Date.now() + NEXT_IN, now: Date.now() });
    },
  });
  const state = stateOf(media, disabled, error);
  const duration = live ? Number.POSITIVE_INFINITY : Number.isFinite(media.duration) ? media.duration : (knownDuration ?? Number.NaN);

  const [quality, setQuality] = useState(qualities?.[0]?.label);
  const source = qualities?.find((option) => option.label === quality)?.src ?? src;

  const [awake, setAwake] = useState(true);
  const [keyboard, setKeyboard] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [captions, setCaptions] = useState(() => tracks.some((track) => track.default));
  const [cue, setCue] = useState('');
  const [hud, setHud] = useState<{ text: string; silent: boolean } | null>(null);
  const [help, setHelp] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hudTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const wake = () => {
    setAwake(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setAwake(false), HIDE_AFTER);
  };

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    const start = () => {
      setAwake(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setAwake(false), HIDE_AFTER);
    };
    const enter = () => setPip(true);
    const leave = () => setPip(false);
    element.addEventListener('play', start);
    element.addEventListener('enterpictureinpicture', enter);
    element.addEventListener('leavepictureinpicture', leave);
    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(hudTimer.current);
      element.removeEventListener('play', start);
      element.removeEventListener('enterpictureinpicture', enter);
      element.removeEventListener('leavepictureinpicture', leave);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setNarrow(entry.contentRect.width < NARROW);
    });
    observer.observe(root);
    const change = () => setFullscreen(document.fullscreenElement === root);
    document.addEventListener('fullscreenchange', change);
    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', change);
    };
  }, []);

  // Cues are drawn by the player (15/22 on a 70 % plate), so the browser keeps the track hidden, not showing.
  useEffect(() => {
    const list = videoRef.current?.textTracks as TextTrackList | undefined;
    if (!list) return;
    const chosen = Math.max(tracks.findIndex((track) => track.default), 0);
    const active = list[chosen];
    for (let index = 0; index < list.length; index++) {
      const track = list[index];
      if (track) setMode(track, captions && index === chosen ? 'hidden' : 'disabled');
    }
    if (!captions || !active) return;
    const show = () => {
      const lines = Array.from(active.activeCues ?? [], (item) => (item as VTTCue).text.replace(/<[^>]+>/g, ''));
      setCue(lines.join('\n'));
    };
    active.addEventListener('cuechange', show);
    return () => active.removeEventListener('cuechange', show);
  }, [captions, tracks]);

  useEffect(() => {
    if (!next) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now < next.deadline) {
        setNext({ deadline: next.deadline, now });
        return;
      }
      setNext(null);
      onNext?.();
    }, 100);
    return () => clearInterval(timer);
  }, [next, onNext]);

  const chrome = state === 'ended' || state === 'error' || pip || !media.started ? 'none' : media.paused || awake || (keyboard && focusInside) || menuOpen ? 'visible' : 'hidden';

  const showHud = (text: string, silent: boolean) => {
    setHud({ text, silent });
    clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(null), HUD_FOR);
  };
  const volumeBy = (delta: number) => {
    const element = videoRef.current;
    if (!element) return;
    // the element, not the state: several presses land before React re-renders
    const volume = Math.round(Math.min(Math.max((element.muted ? 0 : element.volume) + delta, 0), 1) * 100) / 100;
    media.setVolume(volume);
    showHud(volume === 0 ? 'Без звука' : `${Math.round(volume * 100)} %`, volume === 0);
  };
  const toggleFullscreen = () => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => {});
    else void root.requestFullscreen().catch(() => {});
  };
  const togglePip = () => {
    const element = videoRef.current;
    if (!element) return;
    if (pip) void document.exitPictureInPicture().catch(() => {});
    else void element.requestPictureInPicture().catch(() => {});
  };
  const cancelNext = () => {
    if (!next) return;
    setNext(null);
    setNextCancelled(true);
  };
  const start = () => {
    media.toggle();
    // the big button leaves the DOM; keep the keyboard on the player
    requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
  };
  const chooseQuality = (label: string) => {
    const element = videoRef.current;
    if (!element || label === quality) return;
    const time = element.currentTime;
    const resume = !element.paused;
    element.addEventListener(
      'loadedmetadata',
      () => {
        element.currentTime = time;
        if (resume) void element.play().catch(() => {});
      },
      { once: true },
    );
    setQuality(label);
  };

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    cancelNext();
    if (event.key === 'Tab') setKeyboard(true);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || state === 'disabled') return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [role=menu], [contenteditable=true]')) return;
    const onButton = target !== event.currentTarget && target.closest('button, a') !== null;
    const code = event.code;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const act = (run: () => void) => {
      event.preventDefault();
      setKeyboard(true);
      run();
      if (media.started) wake();
    };
    if (key === 'Escape' && help) return act(() => setHelp(false));
    if ((key === ' ' && !onButton) || key === 'k' || code === 'KeyK') return act(media.toggle);
    if (key === 'ArrowRight') return act(() => media.skip(5));
    if (key === 'ArrowLeft') return act(() => media.skip(-5));
    if (key === 'l' || code === 'KeyL') return act(() => media.skip(10));
    if (key === 'j' || code === 'KeyJ') return act(() => media.skip(-10));
    if (key === 'ArrowUp') return act(() => volumeBy(0.05));
    if (key === 'ArrowDown') return act(() => volumeBy(-0.05));
    if (key === 'm' || code === 'KeyM')
      return act(() => {
        const silent = !(media.muted || media.volume === 0);
        media.toggleMute();
        showHud(silent ? 'Без звука' : `${Math.round((media.volume || 0.5) * 100)} %`, silent);
      });
    if (key === 'f' || code === 'KeyF') return act(toggleFullscreen);
    if ((key === 'c' || code === 'KeyC') && tracks.length) return act(() => setCaptions(!captions));
    if (key === '>' || (code === 'Period' && event.shiftKey)) return act(() => media.setRate(stepRate(media.rateNow(), rates, 1)));
    if (key === '<' || (code === 'Comma' && event.shiftKey)) return act(() => media.setRate(stepRate(media.rateNow(), rates, -1)));
    if (key === '?') return act(() => setHelp(!help));
  };

  const behind = live && Number.isFinite(media.duration) && media.duration - media.time > 10;
  const reason = error ? { text: error, action: null } : REASONS[media.error ?? 'network'];
  const left = next ? Math.max(0, Math.ceil((next.deadline - next.now) / 1000)) : 0;
  const playLabel = state === 'playing' || state === 'loading' ? 'Пауза' : 'Смотреть';

  // Tooltips and menus render inside the player only in full screen, where nothing outside it is visible.
  const layer = fullscreen ? rootRef : undefined;
  const toggleButton = (size: 'sm' | 'lg') =>
    size === 'sm' ? (
      <ChromeButton ref={toggleRef} label={playLabel} hint="K" container={layer} onClick={media.toggle} className="size-8">
        {playLabel === 'Пауза' ? <PauseGlyph size={18} /> : <PlayGlyph size={18} />}
      </ChromeButton>
    ) : (
      <button ref={toggleRef} type="button" aria-label={playLabel} onClick={media.toggle} className={cn(startButton, 'size-16')}>
        {playLabel === 'Пауза' ? <PauseGlyph size={26} /> : <PlayGlyph size={26} />}
      </button>
    );
  const skip = (seconds: number, size: 'sm' | 'lg') => (
    <ChromeButton
      label={seconds < 0 ? `Назад на ${-seconds} секунд` : `Вперёд на ${seconds} секунд`}
      hint={seconds < 0 ? 'J' : 'L'}
      container={layer}
      disabled={live}
      onClick={() => media.skip(seconds)}
      className={size === 'sm' ? 'size-8' : cn('size-control-lg bg-media-glass shadow-[0_0_0_1px_var(--color-media-hairline)]')}
    >
      <SkipGlyph direction={seconds < 0 ? 'back' : 'forward'} seconds={Math.abs(seconds)} size={size === 'sm' ? 18 : 22} strokeWidth={1.75} />
    </ChromeButton>
  );
  const fullscreenButton = (size: 'sm' | 'lg') => (
    <ChromeButton label={fullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'} hint="F" container={layer} onClick={toggleFullscreen} className={size === 'sm' ? 'size-8' : 'size-control-lg'}>
      {fullscreen ? <Minimize aria-hidden size={size === 'sm' ? 18 : 20} strokeWidth={1.75} /> : <Maximize aria-hidden size={size === 'sm' ? 18 : 20} strokeWidth={1.75} />}
    </ChromeButton>
  );
  const captionsButton = (size: 'sm' | 'lg') =>
    tracks.length ? (
      <ChromeButton label="Субтитры" hint="C" container={layer} aria-pressed={captions} onClick={() => setCaptions(!captions)} className={size === 'sm' ? 'size-8' : 'size-control-lg'}>
        <Captions aria-hidden size={size === 'sm' ? 18 : 20} strokeWidth={1.75} />
      </ChromeButton>
    ) : null;
  const time = (
    <span className="flex items-baseline gap-1 text-body-xs font-medium tabular-nums">
      <span data-slot="video-player-time" className="text-media-fg-1">
        {formatMediaTime(media.time)}
      </span>
      <span data-slot="video-player-total" className="text-media-fg-3">
        / {formatMediaTime(duration)}
      </span>
    </span>
  );
  const progress = (
    <Progress media={media} duration={duration} chapters={chapters} live={live} narrow={narrow} preview={thumbnails && !narrow} src={source} crossOrigin={crossOrigin} />
  );

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-slot="video-player"
      data-state={state}
      data-chrome={chrome}
      data-narrow={narrow || undefined}
      data-disabled={state === 'disabled' || undefined}
      aria-busy={state === 'loading' || undefined}
      aria-label={typeof title === 'string' ? title : 'Видео'}
      role="region"
      onKeyDown={keys}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (media.started && !media.paused) wake();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        setKeyboard(false);
        cancelNext();
      }}
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
      }}
      className={cn(
        '@container relative isolate aspect-video w-full overflow-hidden rounded-lg bg-media-bg text-media-fg-1 outline-none select-none @min-[480px]:rounded-xl [&:fullscreen]:rounded-none',
        chrome === 'hidden' && 'cursor-none',
        className,
      )}
      {...props}
    >
      <video
        ref={videoRef}
        src={source || undefined}
        poster={poster}
        preload={preload}
        autoPlay={autoplay}
        muted={autoplay}
        loop={loop}
        playsInline
        crossOrigin={crossOrigin}
        className={cn('absolute inset-0 size-full object-contain', (state === 'error' || pip) && 'invisible')}
      >
        {tracks.map((track) => (
          <track key={track.src} kind="subtitles" src={track.src} srcLang={track.srclang} label={track.label} default={track.default} />
        ))}
      </video>

      {/* Click area: a click plays or pauses, on a phone a tap shows the chrome; double click goes full screen. */}
      {media.started && state !== 'error' && state !== 'ended' && !pip ? (
        <div
          aria-hidden
          className="absolute inset-0"
          onClick={(event) => {
            if (narrow || (event.nativeEvent as PointerEvent).pointerType === 'touch') {
              if (chrome === 'hidden') wake();
              else setAwake(false);
            } else media.toggle();
          }}
          onDoubleClick={() => !narrow && toggleFullscreen()}
        />
      ) : null}

      {/* Bottom scrim under the title or the chrome. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-b from-transparent to-media-scrim transition-opacity duration-(--duration-quick) ease-out',
          (state === 'idle' || state === 'disabled' || chrome === 'visible') && !narrow ? 'opacity-100' : 'opacity-0',
        )}
      />

      {narrow && chrome === 'visible' ? <div aria-hidden className="pointer-events-none absolute inset-0 bg-media-bg/45" /> : null}

      {state === 'loading' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-media-bg/40">
          <span data-slot="video-player-spinner" className="text-media-fg-1">
            <RingSpinner size={40} strokeWidth={3} />
          </span>
        </div>
      ) : null}

      {cue && captions ? (
        <div
          data-slot="video-player-captions"
          aria-live="off"
          className="pointer-events-none absolute inset-x-6 flex justify-center transition-[bottom] duration-(--duration-quick) ease-out"
          style={{ bottom: chrome === 'visible' ? (narrow ? 72 : 92) : 24 }}
        >
          <span className="rounded-xs bg-media-scrim px-2 py-[3px] text-center text-[15px] leading-[22px] font-medium whitespace-pre-line text-[oklch(1_0_0)]">{cue}</span>
        </div>
      ) : null}

      {/* Poster: the only control before the first press. */}
      {(state === 'idle' || state === 'disabled') && !(autoplay && media.started) ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <button type="button" aria-label="Смотреть" disabled={state === 'disabled'} onClick={start} className={cn(startButton, 'size-[72px]')}>
              <PlayGlyph size={28} />
            </button>
          </div>
          {title || subtitle || Number.isFinite(duration) ? (
            <div className="pointer-events-none absolute inset-x-6 bottom-5 flex items-end justify-between gap-4 @max-[480px]:inset-x-4 @max-[480px]:bottom-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                {title ? <span className="truncate text-body-md leading-5 font-semibold tracking-[-0.008em] text-media-fg-1">{title}</span> : null}
                {subtitle ? <span className="truncate text-body-xs font-medium text-media-fg-2">{subtitle}</span> : null}
              </div>
              {Number.isFinite(duration) && !live ? (
                <span data-slot="video-player-duration" className="flex h-6 shrink-0 items-center rounded-xs bg-media-scrim px-2 text-caption font-medium text-media-fg-1 tabular-nums">
                  {formatMediaTime(duration)}
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {live ? (
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5">
          <span className="flex h-[22px] items-center gap-[5px] rounded-xs bg-danger px-[7px] text-overline font-bold tracking-overline text-[oklch(1_0_0)] uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-[oklch(1_0_0)]" />
            Эфир
          </span>
          {viewers ? <span className="flex h-[22px] items-center rounded-xs bg-media-scrim px-[7px] text-overline font-semibold text-media-fg-1 tabular-nums">{viewers}</span> : null}
        </div>
      ) : null}
      {behind && chrome !== 'none' ? (
        <button type="button" onClick={() => media.seek(media.duration)} className={cn(pill, glass, 'absolute right-3 bottom-[92px] px-2.5 text-caption')}>
          <span aria-hidden className="size-1.5 rounded-full bg-media-fg-3" />К эфиру
        </button>
      ) : null}

      {autoPlay && media.started && media.muted && state !== 'error' ? (
        <button type="button" data-slot="video-player-unmute" onClick={media.toggleMute} className={cn(pill, glass, 'absolute left-3 pr-3 pl-2.5 text-body-xs', live ? 'top-10' : 'top-3')}>
          <VolumeX aria-hidden size={16} strokeWidth={1.75} />
          Включить звук
        </button>
      ) : null}

      {/* The chrome: one glass bar on desktop, the phone layout below 480. */}
      {chrome !== 'none' ? (
        <div
          data-slot="video-player-chrome"
          className={cn('transition-opacity duration-(--duration-quick) ease-out', chrome === 'hidden' && 'pointer-events-none opacity-0')}
          inert={chrome === 'hidden'}
        >
          {narrow ? (
            <>
              <div className="absolute top-2 right-2 flex gap-1">
                {captionsButton('lg')}
                <MediaMenu
                  container={layer}
                  side="bottom"
                  onOpenChange={setMenuOpen}
                  trigger={
                    <button type="button" aria-label="Ещё" className={cn(chromeButton, 'size-control-lg')}>
                      <Ellipsis aria-hidden size={20} strokeWidth={1.75} />
                    </button>
                  }
                >
                  <MenuChoices label="Скорость воспроизведения" value={media.rate} options={rateOptions(rates)} onChange={media.setRate} />
                  {qualities?.length && quality ? (
                    <MenuChoices label="Качество" value={quality} options={qualities.map((option) => ({ value: option.label, label: option.label }))} onChange={chooseQuality} />
                  ) : null}
                </MediaMenu>
              </div>
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-7">
                {skip(-10, 'lg')}
                {toggleButton('lg')}
                {skip(10, 'lg')}
              </div>
              <div className="absolute inset-x-4 bottom-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-media-fg-1 tabular-nums">
                    <span data-slot="video-player-time">{live ? 'Эфир' : formatMediaTime(media.time)}</span>
                    {live ? null : <span data-slot="video-player-total" className="font-medium text-media-fg-2"> / {formatMediaTime(duration)}</span>}
                  </span>
                  <span className="-my-3 -mr-3">{fullscreenButton('lg')}</span>
                </div>
                {progress}
              </div>
            </>
          ) : (
            <div className={cn('absolute inset-x-3 bottom-3 flex flex-col gap-1 rounded-lg px-3 py-2', glass)}>
              {progress}
              <div className="flex h-8 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-0.5">
                  {toggleButton('sm')}
                  {skip(-10, 'sm')}
                  {skip(10, 'sm')}
                  <VolumeControl media={media} container={layer} />
                  {live ? null : <span className="pl-2">{time}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <MediaMenu
                    container={layer}
                    onOpenChange={setMenuOpen}
                    trigger={
                      <button
                        type="button"
                        aria-label="Скорость воспроизведения"
                        className={cn(chromeButton, 'h-8 px-2 text-body-xs font-semibold tabular-nums')}
                      >
                        {formatRate(media.rate)}
                      </button>
                    }
                  >
                    <MenuChoices label="Скорость воспроизведения" value={media.rate} options={rateOptions(rates)} onChange={media.setRate} />
                  </MediaMenu>
                  {captionsButton('sm')}
                  {qualities?.length && quality ? (
                    <MediaMenu
                      container={layer}
                      onOpenChange={setMenuOpen}
                      trigger={
                        <button type="button" aria-label="Качество" className={cn(chromeButton, 'size-8')}>
                          <SlidersHorizontal aria-hidden size={18} strokeWidth={1.75} />
                        </button>
                      }
                    >
                      <MenuChoices label="Качество" value={quality} options={qualities.map((option) => ({ value: option.label, label: option.label }))} onChange={chooseQuality} />
                    </MediaMenu>
                  ) : null}
                  {pipSupported ? (
                    <ChromeButton label="Картинка в картинке" container={layer} onClick={togglePip} className="size-8">
                      <PictureInPicture2 aria-hidden size={18} strokeWidth={1.75} />
                    </ChromeButton>
                  ) : null}
                  {fullscreenButton('sm')}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {chrome === 'hidden' ? (
        <span aria-hidden data-slot="video-player-line" className="pointer-events-none absolute inset-x-4 bottom-2.5 h-0.5 overflow-hidden rounded-full bg-media-track">
          {state === 'loading' ? <span className="absolute inset-y-0 left-0 bg-media-buffer" style={{ width: `${Number.isFinite(duration) && duration > 0 ? (media.buffered / duration) * 100 : 0}%` }} /> : null}
          <span className={cn('absolute inset-y-0 left-0', live ? 'bg-danger' : 'bg-accent')} style={{ width: live ? '100%' : `${Number.isFinite(duration) && duration > 0 ? (media.time / duration) * 100 : 0}%` }} />
        </span>
      ) : null}

      {hud ? (
        <div
          data-slot="video-player-hud"
          role="status"
          className={cn('pointer-events-none absolute top-1/2 left-1/2 flex size-16 -translate-1/2 flex-col items-center justify-center gap-1 rounded-lg text-caption font-semibold tabular-nums', glass)}
        >
          {hud.silent ? <VolumeX aria-hidden size={20} strokeWidth={1.75} /> : <Volume2 aria-hidden size={20} strokeWidth={1.75} />}
          {hud.text}
        </div>
      ) : null}

      {state === 'ended' ? (
        <div className="absolute inset-0 flex items-center justify-center gap-5 bg-media-bg/65 p-4">
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              aria-label="Ещё раз"
              onClick={() => {
                cancelNext();
                media.toggle();
              }}
              className={cn(startButton, 'size-control-lg')}
            >
              <RotateCcw aria-hidden size={20} strokeWidth={1.75} />
            </button>
            <span aria-hidden className="text-caption font-medium text-media-fg-2">
              Ещё раз
            </span>
          </div>
          {onNext ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label={next ? `Следующее видео через ${left} с` : 'Следующее видео'}
                onClick={() => {
                  setNext(null);
                  onNext();
                }}
                className={cn(startButton, 'relative size-control-lg')}
              >
                {next ? (
                  <svg aria-hidden viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                    <circle cx="22" cy="22" r="20.75" fill="none" stroke="var(--color-media-fg-1)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={(next.deadline - next.now) / NEXT_IN} />
                  </svg>
                ) : null}
                <svg aria-hidden viewBox="0 0 24 24" width={18} height={18} className="relative fill-current">
                  <path d="M5 5.5v13a1 1 0 0 0 1.52.85l9.4-6.5a1 1 0 0 0 0-1.7l-9.4-6.5A1 1 0 0 0 5 5.5Z" />
                  <rect x="17.5" y="5" width="2.5" height="14" rx="1.25" />
                </svg>
              </button>
              <span aria-hidden className="text-caption font-medium text-media-fg-2 tabular-nums">
                {next && !nextCancelled ? `Далее · ${left}` : 'Далее'}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {state === 'error' ? (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-media-bg p-4 text-center">
          <VideoOff aria-hidden size={24} strokeWidth={1.75} className="text-media-fg-3" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-body-sm leading-5 font-semibold text-media-fg-1">Видео не загрузилось</span>
            <span className="text-caption font-medium text-media-fg-3">{reason.text}</span>
          </div>
          {reason.action === 'retry' ? (
            <button type="button" onClick={media.retry} className={cn(pill, 'bg-media-fill-2 px-3 text-body-xs shadow-[0_0_0_1px_var(--color-media-hairline)] hover:bg-media-hairline')}>
              <RotateCcw aria-hidden size={14} strokeWidth={2} />
              Повторить
            </button>
          ) : reason.action === 'download' ? (
            <a href={source} download className={cn(pill, 'bg-media-fill-2 px-3 text-body-xs shadow-[0_0_0_1px_var(--color-media-hairline)] hover:bg-media-hairline')}>
              <Download aria-hidden size={14} strokeWidth={2} />
              Скачать
            </a>
          ) : null}
        </div>
      ) : null}

      {pip ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-media-bg p-4 text-center">
          <PictureInPicture2 aria-hidden size={28} strokeWidth={1.6} className="text-media-fg-3" />
          <span className="text-body-xs font-medium text-media-fg-2">Видео играет в отдельном окне</span>
          <button type="button" onClick={togglePip} className={cn(pill, 'bg-media-fill-2 px-3 text-body-xs shadow-[0_0_0_1px_var(--color-media-hairline)] hover:bg-media-hairline')}>
            Вернуть сюда
          </button>
        </div>
      ) : null}

      {help ? (
        <div role="dialog" aria-label="Клавиши" className={cn('absolute top-1/2 left-1/2 flex w-72 max-w-[calc(100%-24px)] -translate-1/2 flex-col rounded-md p-3', frost, 'bg-media-glass-strong')}>
          <span className="pb-2 text-body-xs font-semibold">Клавиши</span>
          {KEYS.map(([shortcut, action]) => (
            <span key={shortcut} className="flex h-7 items-center justify-between gap-3 text-caption">
              <span className="text-media-fg-2">{action}</span>
              <kbd className="font-mono text-media-fg-1">{shortcut}</kbd>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
