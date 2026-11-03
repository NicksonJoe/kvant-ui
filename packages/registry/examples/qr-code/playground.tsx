import { QR_CODE_STATES, QR_LEVELS, QrCode } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const sizes = ['sm', 'md', 'lg', 'xl'] as const;

const playground: Playground = {
  initial: { value: 'https://norda.cloud/pay/7Kx2-318', 'aria-label': 'QR-код: оплата счёта № 318' },
  controls: [{ name: 'logo', type: 'boolean', default: false, description: 'Знак в центре.' }],
  render: (p) => (
    <QrCode
      value={p.text('value')}
      size={p.pick('size', sizes)}
      level={p.text('level') ? p.pick('level', QR_LEVELS) : undefined}
      state={p.pick('state', QR_CODE_STATES)}
      onRefresh={() => {}}
      aria-label={p.text('aria-label')}
      logo={
        p.bool('logo') ? <span className="grid size-full place-items-center rounded-[7px] bg-accent text-[15px]/4 font-bold text-accent-fg">Н</span> : undefined
      }
    />
  ),
  code: (p) =>
    `<QrCode${p.attrs(['value', 'size', 'level', 'state', 'aria-label'])}${p.bool('logo') ? ' logo={<Logo />}' : ''}${
      p.text('state') === 'expired' || p.text('state') === 'error' ? ' onRefresh={refresh}' : ''
    } />`,
};

export default playground;
