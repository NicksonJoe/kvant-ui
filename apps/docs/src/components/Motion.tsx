import { RotateCcw } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, SegmentedControl } from '@/kvant';
import { FORCED_STATES, type ForcedState, type MotionMeta, type ReadyComponentMeta } from '@/kvant/meta';
import { resolveEasing, scaleTimes } from '../lib/easing';
import { renderPlayground } from '../lib/registry';
import { TOKENS, tokenAnchor, useTokenValues } from '../lib/tokens';
import { EasingCurve } from './EasingCurve';
import { FitScale } from './FitScale';
import { ATTRIBUTES, FOCUSABLE } from './ForcedState';
import { TokenRow } from './TokenRow';

/** What a pointer and then the keyboard do to a pressable: each phase forces these states. */
const PHASES: readonly { label: string; force: readonly ForcedState[] }[] = [
  { label: 'Наведение', force: ['hover'] },
  { label: 'Нажатие', force: ['hover', 'pressed'] },
  { label: 'Отпускание', force: ['hover'] },
  { label: 'Уход', force: [] },
  { label: 'Фокус', force: ['focus'] },
];
const STEP_MS = 700;
const SLOW = 4;
// tokens that carry time: durations, springs and the animations built from them
const TIME_TOKENS = TOKENS.filter((token) => /^--(duration|spring|animate)-/.test(token.name)).map((token) => token.name);

/** A live specimen that replays its states; ×0,25 stretches every duration and spring of the specimen four times. */
export function MotionReplay({ meta }: { meta: ReadyComponentMeta }) {
  const read = useTokenValues();
  const specimenRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const factor = slow ? SLOW : 1;
  const overrides = slow
    ? TIME_TOKENS.flatMap((name) => {
        const value = read(name);
        return value ? [`${name}: ${scaleTimes(value, SLOW)}`] : [];
      }).join('; ')
    : '';

  // custom properties on the specimen's wrapper: its own transitions slow down, the page does not
  useLayoutEffect(() => {
    if (specimenRef.current) specimenRef.current.style.cssText = overrides;
  }, [overrides]);

  useEffect(() => {
    const target = specimenRef.current?.querySelector(FOCUSABLE);
    if (run === 0 || !target) return;
    const force = (states: readonly ForcedState[]) => {
      for (const state of FORCED_STATES) target.toggleAttribute(ATTRIBUTES[state], states.includes(state));
    };
    const timers = PHASES.map((step, index) =>
      window.setTimeout(() => {
        force(step.force);
        setPhase(index);
      }, index * STEP_MS * factor),
    );
    timers.push(
      window.setTimeout(() => {
        force([]);
        setPhase(null);
      }, PHASES.length * STEP_MS * factor),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
      force([]);
    };
  }, [run, factor]);

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
      <div className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2.5">
        <Button size="sm" variant="secondary" leadingIcon={<RotateCcw />} onClick={() => setRun((count) => count + 1)}>
          Повторить
        </Button>
        <SegmentedControl<'normal' | 'slow'>
          aria-label="Скорость"
          value={slow ? 'slow' : 'normal'}
          onValueChange={(next) => setSlow(next === 'slow')}
          options={[
            { value: 'normal', label: '×1' },
            { value: 'slow', label: '×0,25' },
          ]}
        />
        <ol aria-label="Фазы" className="flex flex-wrap items-center gap-1 sm:ml-auto">
          {PHASES.map((step, index) => (
            <li
              key={step.label}
              aria-current={phase === index ? 'step' : undefined}
              className="rounded-full px-2.5 py-1 text-caption font-medium text-fg-3 transition-colors duration-(--duration-micro) ease-hover aria-[current=step]:bg-accent-soft aria-[current=step]:text-accent-soft-fg"
            >
              {step.label}
            </li>
          ))}
        </ol>
      </div>
      <div ref={specimenRef}>
        <FitScale max={2} className="docs-stage h-64 p-10">
          {renderPlayground(meta)}
        </FitScale>
      </div>
    </div>
  );
}

/** The motion rows as on the Paper boards: curve, event, parameters, reduced motion. */
export function MotionTable({ rows }: { rows: readonly MotionMeta[] }) {
  const read = useTokenValues();
  const curves = rows.some((row) => row.easing);
  const reduced = rows.some((row) => row.reduced);
  const head = 'px-4 pt-3.5 pb-2.5 text-caption font-medium text-fg-3';
  const mono = 'flex flex-col gap-0.5 font-mono text-overline font-medium';
  return (
    <div className="overflow-x-auto rounded-xl bg-surface-1 shadow-raised">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-separator">
            {curves ? (
              <th scope="col" className={`${head} w-20`}>
                кривая
              </th>
            ) : null}
            <th scope="col" className={head}>
              событие
            </th>
            <th scope="col" className={head}>
              параметры
            </th>
            {reduced ? (
              <th scope="col" className={head}>
                меньше движения
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-separator last:border-b-0">
              {curves ? <td className="px-4 py-3">{row.easing ? <EasingCurve easing={resolveEasing(row.easing, read)} /> : null}</td> : null}
              <td className="px-4 py-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium text-fg-1">{row.label}</span>
                  {row.note ? <span className="text-body-xs text-fg-2">{row.note}</span> : null}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={mono}>
                  <span className="text-fg-2">{row.value}</span>
                  {row.detail ? <span className="text-fg-3">{row.detail}</span> : null}
                </span>
              </td>
              {reduced ? <td className="px-4 py-3 font-mono text-overline font-medium text-fg-2">{row.reduced ?? '—'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The motion tokens a component uses, with live values and links to /docs/tokens. */
export function MotionTokens({ names }: { names: readonly string[] }) {
  const read = useTokenValues();
  return (
    <div className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      {names.map((name) => (
        <TokenRow key={name} name={`--${name}`} value={read(`--${name}`)} to={`/docs/tokens#${tokenAnchor(`--${name}`)}`} />
      ))}
    </div>
  );
}
