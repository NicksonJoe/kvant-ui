import { useEffect, useMemo, useState, type ComponentProps, type KeyboardEvent } from 'react';
import { ChartLegend, ChartPlot, ChartTooltip, formatNumber, measureText, stepIndex, useHiddenSeries, useWidth } from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* What people talk about: a word cloud for the overview and frequency bars for exact comparison. */

export type WordTone = 'positive' | 'neutral' | 'negative';

export interface WordDatum {
  text: string;
  /** Mentions. */
  value: number;
  /** Colour carries tone only; neutral by default. */
  tone?: WordTone;
}

interface WordChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the words are from; screen readers get them as a table. */
  'aria-label': string;
  words: readonly WordDatum[];
  formatValue?: (value: number) => string;
  /** Name of the count in the tooltip and the table. */
  valueLabel?: string;
  /** Legend names of the tones. */
  toneLabels?: Partial<Record<WordTone, string>>;
}

const TONES: readonly WordTone[] = ['positive', 'neutral', 'negative'];
const TONE_LABELS: Record<WordTone, string> = { positive: 'Хвалят', neutral: 'Нейтрально', negative: 'Ругают' };

/** Words by frequency, ties alphabetically, so the same words always land the same way. */
const byFrequency = (words: readonly WordDatum[]) => [...words].sort((a, b) => b.value - a.value || a.text.localeCompare(b.text, 'ru'));

/** Tone legend and hiding, shared by the cloud and the bars; no legend when nothing carries a tone. */
function useTones(words: readonly WordDatum[], colors: Record<WordTone, string>, labels: Partial<Record<WordTone, string>> | undefined) {
  const [hidden, toggle] = useHiddenSeries();
  const name = (tone: WordTone) => labels?.[tone] ?? TONE_LABELS[tone];
  const toned = words.some((word) => (word.tone ?? 'neutral') !== 'neutral');
  const present = TONES.filter((tone) => words.some((word) => (word.tone ?? 'neutral') === tone));
  const legend = toned ? (
    <ChartLegend items={present.map((tone) => ({ name: name(tone), color: colors[tone] }))} marker="square" hidden={hidden} onToggle={toggle} />
  ) : null;
  return { legend, toned, name, visible: (word: WordDatum) => !hidden.has(name(word.tone ?? 'neutral')) };
}

/** Active word from the pointer or ← → ↑ ↓ Home End, read out through the live region. */
function useStepper(count: number, describe: (index: number) => string) {
  const [raw, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const active = raw !== null && raw < count ? raw : null;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key === 'ArrowDown' ? 'ArrowRight' : event.key === 'ArrowUp' ? 'ArrowLeft' : event.key;
    const index = stepIndex(key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return { active, setActive, spoken, onKeyDown, onBlur: () => setActive(null) };
}

/** Tooltip top under the anchor, or over it when it would run past the bottom of the plot. */
const tooltipTop = (below: number, above: number, rows: number, plot: number) => {
  const height = 30 + rows * 22;
  return below + height <= plot ? below : Math.max(0, above - height);
};

/* ---------- Word cloud ---------- */

export interface WordCloudChartProps extends WordChartProps {
  /** Plot height in px. */
  height?: number;
}

const CLOUD_COLORS: Record<WordTone, string> = { positive: 'var(--color-div-pos-2)', neutral: 'var(--color-fg-3)', negative: 'var(--color-div-neg-2)' };
const MIN_SIZE = 12;
const MAX_SIZE = 40;
const PAD = 2;

// shared measureText gives only the width; Inter's ascender and descender cover lowercase Cyrillic
const ASCENT = 0.72;
const DESCENT = 0.22;

interface PlacedWord {
  word: WordDatum;
  size: number;
  weight: number;
  /** Box top-left and size, px; boxes never overlap. */
  x: number;
  y: number;
  w: number;
  h: number;
  baseline: number;
}

/** Spiral layout from the centre, largest first: each word takes the first spot on an Archimedean spiral (stretched to the plot) where its box hits nothing. */
function layoutCloud(words: readonly WordDatum[], width: number, height: number, family: string): PlacedWord[] {
  const sorted = byFrequency(words);
  const roots = sorted.map((word) => Math.sqrt(Math.max(0, word.value)));
  const lo = Math.min(...roots);
  const hi = Math.max(...roots);
  const stretch = Math.min(2, width / Math.max(1, height));
  const limit = Math.hypot(width, height) / 2;
  const placed: PlacedWord[] = [];
  sorted.forEach((word, index) => {
    const root = roots[index] ?? 0;
    const size = Math.round(hi > lo ? MIN_SIZE + ((MAX_SIZE - MIN_SIZE) * (root - lo)) / (hi - lo) : MAX_SIZE);
    const weight = size >= 22 ? 600 : 500;
    const ascent = Math.ceil(size * ASCENT);
    const w = Math.ceil(measureText(word.text, `${weight} ${size}px ${family}`)) + PAD * 2;
    const h = ascent + Math.ceil(size * DESCENT) + PAD * 2;
    for (let t = 0; t * 0.1 * 1.2 < limit; t += 1) {
      const angle = t * 0.1;
      const radius = angle * 1.2;
      const x = Math.round(width / 2 + radius * Math.cos(angle) * stretch - w / 2);
      const y = Math.round(height / 2 + radius * Math.sin(angle) - h / 2);
      if (x < 0 || y < 0 || x + w > width || y + h > height) continue;
      if (placed.some((other) => x < other.x + other.w && other.x < x + w && y < other.y + other.h && other.y < y + h)) continue;
      placed.push({ word, size, weight, x, y, w, h, baseline: y + PAD + ascent });
      return;
    }
  });
  return placed;
}

/** Overview of what people write: size 12–40 by √frequency, colour by tone only, laid out on a spiral from the centre without overlaps. */
export function WordCloudChart({
  words,
  height = 282,
  formatValue = formatNumber,
  valueLabel = 'Упоминаний',
  toneLabels,
  className,
  'aria-label': label,
  ...props
}: WordCloudChartProps) {
  const [ref, width] = useWidth(560);
  const [family, setFamily] = useState('sans-serif');
  useEffect(() => {
    const el = ref.current;
    if (!el || !('fonts' in document)) return;
    let live = true;
    // measure with the real face once web fonts are in, or the boxes fit the fallback font
    document.fonts.ready.then(() => {
      if (live) setFamily(getComputedStyle(el).fontFamily || 'sans-serif');
    });
    return () => {
      live = false;
    };
  }, [ref]);
  const placed = useMemo(() => layoutCloud(words, width, height, family), [words, width, height, family]);
  const tones = useTones(words, CLOUD_COLORS, toneLabels);
  const shown = placed.filter((item) => tones.visible(item.word));
  const describe = (item: PlacedWord) =>
    `${item.word.text}: ${formatValue(item.word.value)}${tones.toned ? `, ${tones.name(item.word.tone ?? 'neutral')}` : ''}`;
  const step = useStepper(shown.length, (index) => {
    const item = shown[index];
    return item ? describe(item) : '';
  });
  const active = step.active === null ? undefined : shown[step.active];

  return (
    <div data-slot="word-cloud-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {tones.legend}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Слово',
          columns: [valueLabel, ...(tones.toned ? ['Тон'] : [])],
          rows: byFrequency(words).map((word) => ({
            header: word.text,
            cells: [formatValue(word.value), ...(tones.toned ? [tones.name(word.tone ?? 'neutral')] : [])],
          })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible" onPointerLeave={() => step.setActive(null)}>
          {shown.map((item, index) => (
            <g
              key={item.word.text}
              className="origin-center transition-[opacity,scale] duration-(--duration-slow) ease-out [transform-box:fill-box] starting:scale-75 starting:opacity-0 motion-reduce:transition-none"
              style={{ transitionDelay: `${Math.min(index, 24) * 20}ms` }}
            >
              <text
                data-slot="word-cloud-word"
                data-tone={item.word.tone ?? 'neutral'}
                data-x={item.x}
                data-y={item.y}
                data-w={item.w}
                data-h={item.h}
                x={item.x + item.w / 2}
                y={item.baseline}
                textAnchor="middle"
                fontSize={item.size}
                fontWeight={item.weight}
                fill={CLOUD_COLORS[item.word.tone ?? 'neutral']}
                opacity={active && active !== item ? 0.3 : 1}
                onPointerEnter={() => step.setActive(index)}
                className="cursor-default transition-opacity duration-(--duration-quick)"
              >
                {item.word.text}
              </text>
            </g>
          ))}
        </svg>
        {active ? (
          <ChartTooltip
            x={active.x + active.w / 2}
            width={width}
            y={tooltipTop(active.y + active.h + 4, active.y - 4, tones.toned ? 2 : 1, height)}
            title={active.word.text}
            rows={[
              { name: valueLabel, value: formatValue(active.word.value) },
              ...(tones.toned ? [{ name: 'Тон', value: tones.name(active.word.tone ?? 'neutral'), color: CLOUD_COLORS[active.word.tone ?? 'neutral'] }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Frequency bars ---------- */

export type WordBarChartProps = WordChartProps;

const BAR_COLORS: Record<WordTone, string> = { positive: 'var(--color-div-pos-2)', neutral: 'var(--color-fg-4)', negative: 'var(--color-div-neg-2)' };
const WORD_ROW = 22;
const COUNT_SPACE = 64;

/** The cloud's data where lengths compare: 14px bars from one axis, sorted by frequency, tone in the same colours. */
export function WordBarChart({ words, formatValue = formatNumber, valueLabel = 'Упоминаний', toneLabels, className, 'aria-label': label, ...props }: WordBarChartProps) {
  const [ref, width] = useWidth(604);
  const tones = useTones(words, BAR_COLORS, toneLabels);
  const sorted = byFrequency(words);
  const rows = sorted.filter(tones.visible);
  // one axis for all words: hiding a tone does not rescale the rest
  const max = Math.max(0, ...sorted.map((word) => word.value));
  const labelWidth = Math.round(Math.min(110, Math.max(80, width * 0.18)));
  const track = Math.max(1, width - labelWidth - COUNT_SPACE);
  const barWidth = (value: number) => (max > 0 ? Math.round((Math.max(0, value) / max) * track * 10) / 10 : 0);
  const step = useStepper(rows.length, (index) => {
    const word = rows[index];
    return word ? `${word.text}: ${formatValue(word.value)}${tones.toned ? `, ${tones.name(word.tone ?? 'neutral')}` : ''}` : '';
  });
  const active = step.active === null ? undefined : rows[step.active];

  return (
    <div data-slot="word-bar-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {tones.legend}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Слово',
          columns: [valueLabel, ...(tones.toned ? ['Тон'] : [])],
          rows: sorted.map((word) => ({ header: word.text, cells: [formatValue(word.value), ...(tones.toned ? [tones.name(word.tone ?? 'neutral')] : [])] })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <div aria-hidden className="relative" onPointerLeave={() => step.setActive(null)}>
          <span className="absolute inset-y-0 w-px bg-border" style={{ left: labelWidth }} />
          {rows.map((word, index) => {
            const bar = barWidth(word.value);
            const tone = word.tone ?? 'neutral';
            return (
              <div
                key={word.text}
                data-slot="word-bar-row"
                data-label={word.text}
                data-tone={tone}
                data-active={step.active === index || undefined}
                onPointerEnter={() => step.setActive(index)}
                className="relative flex h-5.5 items-center rounded-xs transition-colors duration-(--duration-micro) data-active:bg-fill-1"
              >
                <span className="truncate pr-2.5 text-right text-caption text-fg-1" style={{ width: labelWidth }}>
                  {word.text}
                </span>
                <span
                  data-slot="word-bar"
                  className="absolute top-1 h-3.5 origin-left rounded-r-[3px] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0 motion-reduce:transition-none"
                  style={{ left: labelWidth, width: bar, background: BAR_COLORS[tone], transitionDelay: `${Math.min(index, 20) * 25}ms` }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-caption whitespace-nowrap text-fg-2 tabular-nums transition-opacity duration-(--duration-slow) ease-out starting:opacity-0 motion-reduce:transition-none"
                  style={{ left: labelWidth + bar + 6 }}
                >
                  {formatValue(word.value)}
                </span>
              </div>
            );
          })}
        </div>
        {active && step.active !== null ? (
          <ChartTooltip
            x={labelWidth + barWidth(active.value)}
            width={width}
            y={tooltipTop((step.active + 1) * WORD_ROW, step.active * WORD_ROW, tones.toned ? 2 : 1, rows.length * WORD_ROW)}
            title={active.text}
            rows={[
              { name: valueLabel, value: formatValue(active.value) },
              ...(tones.toned ? [{ name: 'Тон', value: tones.name(active.tone ?? 'neutral'), color: BAR_COLORS[active.tone ?? 'neutral'] }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}
