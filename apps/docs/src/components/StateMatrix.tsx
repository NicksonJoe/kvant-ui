import { cn } from '@/kvant';
import { createPropReader, initialValues, type PropValue, type PropValues, type ReadyComponentMeta } from '@/kvant/meta';
import { usePreview } from '../lib/preview';
import { getPlayground } from '../lib/registry';
import { stateLanes, type StateLane } from '../lib/states';
import { ForcedState } from './ForcedState';
import { MODES, MODE_NAMES, ThemeScope } from './Stage';

interface Row {
  key: string;
  label: string;
  /** Mono line: the prop value that makes the row. */
  code?: string;
  props: PropValues;
  tokens?: readonly string[];
}

const mono = 'font-mono text-overline font-medium text-fg-3';
// the row names stay in view while a wide matrix scrolls
const sticky = 'sticky left-0 z-10 bg-surface-1';

/** Variants × states as on the Paper boards; light and dark one under the other when the preview compares modes. */
export function StateMatrix({ meta }: { meta: ReadyComponentMeta }) {
  const [{ compare }] = usePreview();
  const notes = meta.matrix?.notes ?? [];
  return (
    <div className="flex flex-col gap-4">
      {compare ? (
        MODES.map((mode) => (
          <ThemeScope key={mode} mode={mode} className="flex flex-col gap-2 rounded-2xl bg-background p-3">
            <span className="px-1 text-caption font-medium text-fg-3">{MODE_NAMES[mode]}</span>
            <Matrix meta={meta} />
          </ThemeScope>
        ))
      ) : (
        <Matrix meta={meta} />
      )}
      {notes.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {notes.map((note) => (
            <p key={note} className={mono}>
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The row's first prop as JSX shows it: `primary`, `defaultChecked`, `open={false}`. */
function propText(props: PropValues): string | undefined {
  const [entry] = Object.entries(props);
  if (!entry) return undefined;
  const [name, value]: [string, PropValue] = entry;
  return value === true ? name : value === false ? `${name}={false}` : String(value);
}

/** Every cell is a live component: hover, pressed and focus are forced, the other states are set by props. */
function Matrix({ meta }: { meta: ReadyComponentMeta }) {
  const playground = getPlayground(meta.id);
  const matrix = meta.matrix;
  if (!playground || !matrix) return null;

  const props = [...meta.props, ...(playground.controls ?? [])];
  const base = initialValues(props, playground.initial);
  const optionsOf = (name: string) => meta.props.find((prop) => prop.name === name)?.options ?? [];

  const rowProp = matrix.rowProp ?? Object.keys(matrix.rows?.[0]?.props ?? {})[0];
  const rows: Row[] = matrix.rowProp
    ? optionsOf(matrix.rowProp).map((option) => ({ key: String(option), label: '', code: String(option), props: { [matrix.rowProp ?? '']: option } }))
    : (matrix.rows ?? [{ label: '', props: {} }]).map((row) => ({
        key: row.label,
        label: row.label,
        code: propText(row.props),
        props: row.props,
        tokens: row.tokens,
      }));

  const columns: StateLane[] = matrix.columnProp
    ? optionsOf(matrix.columnProp).map((option) => ({ key: String(option), label: String(option), selector: '', props: { [matrix.columnProp ?? '']: option } }))
    : stateLanes(meta, matrix.columns);

  const labelled = rows.some((row) => row.label || row.code);
  const withTokens = rows.some((row) => row.tokens);
  // the token paths read rest → hover → pressed, in the order of the columns
  const tokenPath = columns
    .filter((column) => ['rest', 'hover', 'pressed'].includes(column.key))
    .map((column) => column.label)
    .join(' → ');

  return (
    // relative: sr-only live regions of the cells stay in the scroller instead of widening the page
    <div className="relative overflow-x-auto rounded-xl bg-surface-1 shadow-raised">
      <table className="border-collapse">
        <thead>
          <tr className="border-b border-separator">
            {labelled ? (
              <td className={`${sticky} w-36 min-w-36 px-4 pt-4 pb-3 align-bottom`}>
                <HeadText label={matrix.rowsLabel} code={rowProp} />
              </td>
            ) : null}
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 pt-4 pb-3 text-left align-bottom">
                <HeadText label={matrix.columnProp ? undefined : column.label} code={matrix.columnProp ? column.label : column.selector} />
              </th>
            ))}
            {withTokens ? (
              <th scope="col" className="px-4 pt-4 pb-3 text-left align-bottom">
                <HeadText label="токены" code={tokenPath} />
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-separator last:border-b-0">
              {labelled ? (
                <th scope="row" className={`${sticky} px-4 text-left align-middle`}>
                  <span className="flex flex-col gap-0.5 whitespace-nowrap">
                    {row.label ? <span className="text-body-xs font-medium text-fg-2">{row.label}</span> : null}
                    {row.code ? <span className={cn(mono, !row.label && 'text-caption text-fg-2')}>{row.code}</span> : null}
                  </span>
                </th>
              ) : null}
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4 align-middle">
                  {/* a 160px lane that grows for wider content (rating lg, editable, messages); fields stop at 288px */}
                  <div className="flex min-h-11 w-max max-w-72 min-w-40 items-center [&>*]:max-w-full">
                    <ForcedState state={column.forced}>
                      {playground.render(createPropReader(props, { ...base, ...row.props, ...column.props }))}
                    </ForcedState>
                  </div>
                </td>
              ))}
              {withTokens ? (
                <td className="px-4 align-middle">
                  <span className="flex flex-col gap-0.5 whitespace-nowrap">
                    {row.tokens?.map((line) => (
                      <span key={line} className={mono}>
                        {line}
                      </span>
                    ))}
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadText({ label, code }: { label?: string; code?: string }) {
  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap">
      {label ? <span className="text-caption font-medium text-fg-3">{label}</span> : null}
      {code ? <span className={mono}>{code}</span> : null}
    </span>
  );
}
