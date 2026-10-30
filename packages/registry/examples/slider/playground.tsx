import { Slider } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const percent = (value: number) => `${value} %`;

const playground: Playground = {
  initial: { label: 'Скидка по умолчанию' },
  controls: [{ name: 'range', type: 'boolean', default: false, description: 'Диапазон из двух бегунков.' }],
  render: (p) => (
    <Slider
      // remount when the shape of the value changes: it is uncontrolled
      key={String(p.bool('range'))}
      label={p.text('label') || undefined}
      aria-label={p.text('label') ? undefined : 'Скидка'}
      defaultValue={p.bool('range') ? [20, 60] : 40}
      min={p.num('min')}
      max={p.num('max')}
      step={p.pick('step', [1, 5, 10, 25] as const)}
      showLimits={p.bool('showLimits')}
      disabled={p.bool('disabled')}
      formatValue={percent}
      className="w-72 max-w-full"
    />
  ),
  code: (p) => {
    const name = p.text('label') ? '' : ' aria-label="Скидка"';
    const value = p.bool('range') ? '[20, 60]' : '40';
    return `<Slider${name}${p.attrs(['label', 'min', 'max', 'step', 'showLimits', 'disabled'])}
  defaultValue={${value}}
  formatValue={(value) => \`\${value} %\`}
/>`;
  },
};

export default playground;
