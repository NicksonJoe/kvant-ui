import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { cn } from './cn';

/* ---------- pure helpers ---------- */

export interface MediaChapter {
  /** Start, seconds from the beginning. */
  start: number;
  title: string;
}

/** `missing` and `forbidden` come from asking the server: the element reports a 404 as an unsupported format. */
export type MediaErrorReason = 'network' | 'format' | 'decode' | 'aborted' | 'missing' | 'forbidden';

const pad = (value: number) => String(value).padStart(2, '0');

/** «4:12», «46:30», «1:02:05»; NaN, Infinity and negatives read as 0:00. */
export function formatMediaTime(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const rest = total % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

/** «осталось 28 мин», «осталось 1 ч 5 мин», «осталось меньше минуты». */
export function formatRemaining(seconds: number): string {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  if (minutes === 0) return 'осталось меньше минуты';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `осталось ${[hours ? `${hours} ч` : '', rest ? `${rest} мин` : ''].filter(Boolean).join(' ')}`;
}

const rateFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

/** «1,25×». */
export const formatRate = (rate: number): string => `${rateFormat.format(rate)}×`;

/** End of the buffered range that holds `time`; `time` itself when nothing ahead is loaded. */
export function bufferedEnd(ranges: TimeRanges, time: number): number {
  for (let index = 0; index < ranges.length; index++) {
    // half a second of slack: the playhead sits a frame before the range a seek just started
    if (ranges.start(index) <= time + 0.5 && ranges.end(index) >= time) return ranges.end(index);
  }
  return time;
}

/** Index of the chapter playing at `time`, −1 without chapters. */
export function chapterAt(chapters: readonly MediaChapter[], time: number): number {
  let found = -1;
  chapters.forEach((chapter, index) => {
    if (chapter.start <= time) found = index;
  });
  return found;
}

export interface SeekKeyContext {
  time: number;
  duration: number;
  chapters: readonly MediaChapter[];
  /** Arrows (default 5 s). */
  step?: number;
  /** Shift + arrows (default 15 s). */
  largeStep?: number;
}

/** New time for a key on a position slider, `null` when the key is not a seek key. */
export function seekByKey(event: { key: string; shiftKey: boolean }, { time, duration, chapters, step = 5, largeStep = 15 }: SeekKeyContext): number | null {
  const by = event.shiftKey ? largeStep : step;
  const clamp = (value: number) => Math.min(Math.max(value, 0), duration);
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(time + by);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(time - by);
    case 'Home':
      return 0;
    case 'End':
      return duration;
    case 'PageUp': {
      if (!chapters.length) return clamp(time + duration / 10);
      return chapters.find((chapter) => chapter.start > time)?.start ?? duration;
    }
    case 'PageDown': {
      if (!chapters.length) return clamp(time - duration / 10);
      const index = chapterAt(chapters, time);
      const current = chapters[index];
      if (!current) return 0;
      // a second into a chapter PageDown restarts it; right at its start it goes one back
      return time - current.start < 1 ? (chapters[index - 1]?.start ?? 0) : current.start;
    }
    default:
      return null;
  }
}

/** Next rate in the list, back to the first after the last. */
export function cycleRate(rate: number, rates: readonly number[]): number {
  return rates.find((value) => value > rate) ?? rates[0] ?? 1;
}

/** One step up or down the list, stopping at its ends. */
export function stepRate(rate: number, rates: readonly number[], direction: 1 | -1): number {
  if (direction === 1) return rates.find((value) => value > rate) ?? rates[rates.length - 1] ?? rate;
  return rates.findLast((value) => value < rate) ?? rates[0] ?? rate;
}

/** RMS of each of `bars` equal slices, scaled so the loudest is 1; silence stays 0. */
export function waveformPeaks(samples: ArrayLike<number>, bars: number): number[] {
  const size = samples.length / bars;
  const rms = Array.from({ length: bars }, (_, bar) => {
    const from = Math.floor(bar * size);
    const to = Math.max(from + 1, Math.floor((bar + 1) * size));
    let sum = 0;
    for (let index = from; index < to; index++) sum += (samples[index] ?? 0) ** 2;
    return Math.sqrt(sum / (to - from));
  });
  const loudest = Math.max(...rms);
  return loudest > 0 ? rms.map((value) => value / loudest) : rms;
}

/** Peaks resampled to `bars` (each bar keeps the loudest of its slice). */
export function resamplePeaks(peaks: readonly number[], bars: number): number[] {
  if (!peaks.length) return Array.from({ length: bars }, () => 0);
  const size = peaks.length / bars;
  return Array.from({ length: bars }, (_, bar) => {
    const from = Math.floor(bar * size);
    const to = Math.max(from + 1, Math.floor((bar + 1) * size));
    return Math.max(...peaks.slice(from, to));
  });
}

/** MediaError.code → what the user is told. */
export function mediaErrorReason(code: number | undefined): MediaErrorReason {
  if (code === 1) return 'aborted';
  if (code === 3) return 'decode';
  if (code === 4) return 'format';
  return 'network';
}

export const prefersReducedMotion = (): boolean =>
  document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- one player at a time ---------- */

interface Registered {
  element: HTMLMediaElement;
  /** Players of one chain start each other in DOM order (voice messages). */
  chain?: string;
}

const registry = new Set<Registered>();

/** Only sound competes: a muted autoplay neither stops others nor is stopped. */
function onPlay(element: HTMLMediaElement) {
  if (element.muted) return;
  for (const entry of registry) if (entry.element !== element && !entry.element.paused && !entry.element.muted) entry.element.pause();
}

function playNext(entry: Registered) {
  const chain = [...registry]
    .filter((other) => other.chain === entry.chain)
    .sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const next = chain[chain.indexOf(entry) + 1];
  if (next) void next.element.play().catch(() => {});
}

/* ---------- the element as React state ---------- */

export interface MediaState {
  paused: boolean;
  ended: boolean;
  /** Played at least once since mount. */
  started: boolean;
  time: number;
  /** NaN until metadata, Infinity for a live stream. */
  duration: number;
  /** End of the buffered range under the playhead. */
  buffered: number;
  volume: number;
  muted: boolean;
  rate: number;
  /** Playback is wanted but the buffer has been empty for 300 ms. */
  loading: boolean;
  error: MediaErrorReason | null;
}

export interface MediaControls {
  /** The element's own playhead: fresher than `time` between a seek and the next render. */
  now(): number;
  /** The element's own rate, for the same reason. */
  rateNow(): number;
  play(): void;
  pause(): void;
  /** Play, pause, or start over after the end. */
  toggle(): void;
  seek(time: number): void;
  skip(delta: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  setRate(rate: number): void;
  /** Reload after an error and carry on from the same second. */
  retry(): void;
}

export type Media = MediaState & MediaControls;

export interface UseMediaOptions {
  chain?: string;
  onEnded?: () => void;
}

const LOADING_DELAY = 300;

function read(element: HTMLMediaElement, started: boolean, loading: boolean, probed: MediaErrorReason | null): MediaState {
  return {
    paused: element.paused,
    ended: element.ended,
    started,
    time: element.currentTime,
    duration: element.duration,
    buffered: bufferedEnd(element.buffered, element.currentTime),
    volume: element.volume,
    muted: element.muted,
    rate: element.playbackRate,
    loading,
    error: element.error ? (probed ?? mediaErrorReason(element.error.code)) : null,
  };
}

const INITIAL: MediaState = {
  paused: true,
  ended: false,
  started: false,
  time: 0,
  duration: Number.NaN,
  buffered: 0,
  volume: 1,
  muted: false,
  rate: 1,
  loading: false,
  error: null,
};

const same = (a: MediaState, b: MediaState) =>
  (Object.keys(a) as (keyof MediaState)[]).every((key) => Object.is(a[key], b[key]));

/** Subscribes to an <audio>/<video> and reads it every frame while it plays, so progress moves smoothly. */
export function useMedia(ref: RefObject<HTMLMediaElement | null>, { chain, onEnded }: UseMediaOptions = {}): Media {
  const [state, setState] = useState<MediaState>(INITIAL);
  const endedRef = useRef(onEnded);
  useLayoutEffect(() => {
    endedRef.current = onEnded;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const entry: Registered = { element, chain };
    registry.add(entry);
    let started = false;
    let loading = false;
    let probed: MediaErrorReason | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    const sync = () => setState((previous) => {
      const next = read(element, started, loading, probed);
      return same(previous, next) ? previous : next;
    });
    const loop = () => {
      sync();
      frame = element.paused ? 0 : requestAnimationFrame(loop);
    };
    const stopLoading = () => {
      clearTimeout(timer);
      loading = false;
    };
    const handlers: Record<string, () => void> = {
      play: () => {
        started = true;
        onPlay(element);
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(loop);
      },
      waiting: () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          loading = !element.paused;
          sync();
        }, LOADING_DELAY);
      },
      playing: stopLoading,
      pause: stopLoading,
      error: () => {
        stopLoading();
        const code = element.error?.code;
        const url = element.currentSrc;
        if ((code !== 2 && code !== 4) || !/^https?:/.test(url)) return;
        // HEAD tells a missing file and a closed one from a real format or network problem
        void fetch(url, { method: 'HEAD' })
          // a dev server or a CDN answers a missing file with its HTML page
          .then((response) =>
            response.status === 404 || response.status === 410 || (response.ok && response.headers.get('content-type')?.startsWith('text/html'))
              ? 'missing'
              : response.status === 401 || response.status === 403
                ? 'forbidden'
                : null,
          )
          .catch((): MediaErrorReason => 'network')
          .then((reason) => {
            probed = reason;
            sync();
          });
      },
      emptied: () => {
        stopLoading();
        probed = null;
      },
      canplaythrough: stopLoading,
      // a muted autoplay that gets its sound joins the one-at-a-time rule
      volumechange: () => {
        if (!element.paused) onPlay(element);
      },
      ended: () => {
        stopLoading();
        endedRef.current?.();
        if (chain) playNext(entry);
      },
    };
    const events = ['timeupdate', 'durationchange', 'loadedmetadata', 'progress', 'ratechange', 'seeking', 'seeked', 'canplay', ...Object.keys(handlers)];
    const listener = (event: Event) => {
      handlers[event.type]?.();
      sync();
    };
    for (const type of events) element.addEventListener(type, listener);
    sync();
    return () => {
      registry.delete(entry);
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      for (const type of events) element.removeEventListener(type, listener);
    };
  }, [ref, chain]);

  const controls = useMemo((): MediaControls => {
    const element = () => ref.current;
    const play = () => {
      const media = element();
      // autoplay policy or an aborted load: the error event already tells the user
      if (media) void media.play().catch(() => {});
    };
    return {
      now: () => element()?.currentTime ?? 0,
      rateNow: () => element()?.playbackRate ?? 1,
      play,
      pause: () => element()?.pause(),
      toggle: () => {
        const media = element();
        if (!media) return;
        if (media.ended) media.currentTime = 0;
        if (media.paused || media.ended) play();
        else media.pause();
      },
      seek: (time) => {
        const media = element();
        if (media && Number.isFinite(media.duration)) media.currentTime = Math.min(Math.max(time, 0), media.duration);
      },
      skip: (delta) => {
        const media = element();
        if (media && Number.isFinite(media.duration)) media.currentTime = Math.min(Math.max(media.currentTime + delta, 0), media.duration);
      },
      setVolume: (volume) => {
        const media = element();
        if (!media) return;
        media.volume = Math.min(Math.max(volume, 0), 1);
        media.muted = volume <= 0;
      },
      toggleMute: () => {
        const media = element();
        if (!media) return;
        media.muted = !media.muted;
        // unmuting a slider pulled to zero would stay silent
        if (!media.muted && media.volume === 0) media.volume = 0.5;
      },
      setRate: (rate) => {
        const media = element();
        if (media) media.playbackRate = rate;
      },
      retry: () => {
        const media = element();
        if (!media) return;
        const at = media.currentTime;
        media.load();
        if (at > 0) media.addEventListener('loadedmetadata', () => (media.currentTime = at), { once: true });
        play();
      },
    };
  }, [ref]);

  return { ...state, ...controls };
}

/* ---------- pointer scrubbing ---------- */

export interface Scrub {
  /** Time under the pointer, `null` when it is away. */
  hover: number | null;
  dragging: boolean;
  handlers: {
    onPointerDown(event: PointerEvent<HTMLElement>): void;
    onPointerMove(event: PointerEvent<HTMLElement>): void;
    onPointerUp(event: PointerEvent<HTMLElement>): void;
    onPointerCancel(event: PointerEvent<HTMLElement>): void;
    onPointerLeave(event: PointerEvent<HTMLElement>): void;
  };
}

/** Press, drag and hover over a horizontal track by mouse, pen or finger; seeks while pressed. */
export function useScrub({ duration, disabled = false, onSeek }: { duration: number; disabled?: boolean; onSeek(time: number): void }): Scrub {
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const usable = !disabled && Number.isFinite(duration) && duration > 0;

  const at = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      return box.width > 0 ? Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * duration : 0;
    },
    [duration],
  );

  const release = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // a finger lifts away: nothing hovers any more
    if (event.pointerType === 'touch') setHover(null);
  }, []);

  return {
    hover: usable ? hover : null,
    dragging,
    handlers: {
      onPointerDown: (event) => {
        if (!usable || event.button > 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        draggingRef.current = true;
        setDragging(true);
        const time = at(event);
        setHover(time);
        onSeek(time);
      },
      onPointerMove: (event) => {
        if (!usable) return;
        const time = at(event);
        setHover(time);
        if (draggingRef.current) onSeek(time);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: () => {
        if (!draggingRef.current) setHover(null);
      },
    },
  };
}

/* ---------- waveform from the file itself ---------- */

const PEAKS = 256;
const decoded = new Map<string, Promise<number[] | null>>();

const canDecode = () => typeof OfflineAudioContext !== 'undefined';

/**
 * Decodes the file once per src with Web Audio into 256 normalised peaks. `undefined` while decoding,
 * `null` when it cannot (no Web Audio, CORS, a broken file) — draw flat bars then.
 */
export function useWaveform(src: string, given?: readonly number[]): readonly number[] | null | undefined {
  const [peaks, setPeaks] = useState<{ src: string; value: readonly number[] | null } | null>(null);
  useEffect(() => {
    if (given || !canDecode()) return;
    let live = true;
    let job = decoded.get(src);
    if (!job) {
      job = fetch(src)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
        .then((buffer) => new OfflineAudioContext(1, 1, 22050).decodeAudioData(buffer))
        .then((audio) => waveformPeaks(audio.getChannelData(0), PEAKS))
        .catch(() => null);
      decoded.set(src, job);
    }
    void job.then((value) => {
      if (live) setPeaks({ src, value });
    });
    return () => {
      live = false;
    };
  }, [src, given]);
  if (given) return given;
  if (!canDecode()) return null;
  return peaks?.src === src ? peaks.value : undefined;
}

/* ---------- glyphs shared by the players ---------- */

/** Solid rounded triangle of the play buttons. */
export function PlayGlyph({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className="shrink-0 fill-current">
      <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function PauseGlyph({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className="shrink-0 fill-current">
      <rect x="6" y="5" width="4" height="14" rx="1.25" />
      <rect x="14" y="5" width="4" height="14" rx="1.25" />
    </svg>
  );
}

/** Circular arrow with the number of seconds inside: 8 px 700 digits centred in the button. */
export function SkipGlyph({ direction, seconds, size, strokeWidth = 1.6 }: { direction: 'back' | 'forward'; seconds: number; size: number; strokeWidth?: number }) {
  return (
    <>
      <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        {direction === 'back' ? (
          <>
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v5h5" />
          </>
        ) : (
          <>
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v5h-5" />
          </>
        )}
      </svg>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[8px] leading-3 font-bold tabular-nums">
        {seconds}
      </span>
    </>
  );
}

/** Ring spinner: a 30 % track and a quarter arc in the current colour. */
export function RingSpinner({ size, strokeWidth = 4, className }: { size: number; strokeWidth?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={cn('shrink-0 animate-spinner', className)}>
      <circle cx="20" cy="20" r="15" className="opacity-30" />
      <path d="M20 5a15 15 0 0 1 15 15" strokeLinecap="round" />
    </svg>
  );
}
