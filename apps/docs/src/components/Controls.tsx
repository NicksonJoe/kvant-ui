import { useId } from 'react';
import { Input, SegmentedControl, Select, Switch } from '@/kvant';
import type { PropMeta, PropValue, PropValues } from '@/kvant/meta';

const EDITABLE = new Set(['enum', 'boolean', 'string', 'number']);

/** Props the Controls panel can edit: scalars that are not hidden with `control: false`. */
export function editableProps(props: readonly PropMeta[]): PropMeta[] {
  return props.filter((prop) => prop.control !== false && EDITABLE.has(prop.type));
}

export interface ControlsProps {
  props: readonly PropMeta[];
  values: PropValues;
  onChange: (name: string, value: PropValue) => void;
}

export function Controls({ props, values, onChange }: ControlsProps) {
  const editable = editableProps(props);
  if (editable.length === 0) {
    return <p className="text-body-xs text-fg-3">У компонента нет простых свойств — смотрите примеры ниже.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {editable.map((prop) => (
        <Control key={prop.name} prop={prop} value={values[prop.name]} onChange={(value) => onChange(prop.name, value)} />
      ))}
    </div>
  );
}

const NONE = '';
const segmentFill = 'w-full [&>[data-slot=segment]]:flex-1 [&>[data-slot=segment]]:px-1.5';

function Control({ prop, value, onChange }: { prop: PropMeta; value: PropValue | undefined; onChange: (value: PropValue) => void }) {
  const labelId = useId();
  const label = (
    <span id={labelId} className="font-mono text-caption text-fg-2">
      {prop.name}
    </span>
  );

  if (prop.type === 'boolean') {
    return (
      <Switch checked={value === true} onCheckedChange={onChange}>
        {label}
      </Switch>
    );
  }

  if (prop.options) {
    // Without a default the prop can stay unset: offer «—».
    const options = [...(prop.default === undefined ? [NONE] : []), ...prop.options.map(String)];
    const parse = (next: string): PropValue => (prop.type === 'number' && next !== NONE ? Number(next) : next);
    const current = value === undefined ? NONE : String(value);
    const short = options.length <= 5 && options.every((option) => option.length <= 8);
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        {short ? (
          <SegmentedControl
            aria-labelledby={labelId}
            className={segmentFill}
            value={current}
            onValueChange={(next) => onChange(parse(next))}
            options={options.map((option) => ({ value: option, label: option === NONE ? '—' : option }))}
          />
        ) : (
          <Select
            aria-label={prop.name}
            size="sm"
            value={current}
            onValueChange={(next) => onChange(parse(next ?? NONE))}
            options={options.map((option) => ({ value: option, label: option === NONE ? '—' : option }))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <Input
        size="sm"
        aria-labelledby={labelId}
        type={prop.type === 'number' ? 'number' : 'text'}
        value={value === undefined ? '' : String(value)}
        onValueChange={(next) => onChange(prop.type === 'number' ? Number(next) : next)}
      />
    </div>
  );
}
