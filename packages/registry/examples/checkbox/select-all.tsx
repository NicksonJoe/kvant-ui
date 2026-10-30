import { useState } from 'react';
import { Checkbox } from '@/kvant';

const channels = ['Почта', 'Telegram', 'СМС'] as const;
type Channel = (typeof channels)[number];

export default function CheckboxSelectAll() {
  const [selected, setSelected] = useState<readonly Channel[]>(['Почта']);
  const all = selected.length === channels.length;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-label-sm font-medium text-fg-2">Каналы рассылки</legend>
      <Checkbox
        checked={all}
        indeterminate={selected.length > 0 && !all}
        onCheckedChange={(checked) => setSelected(checked ? channels : [])}
      >
        Все каналы
      </Checkbox>
      <div className="flex flex-col gap-3 pl-7">
        {channels.map((channel) => (
          <Checkbox
            key={channel}
            checked={selected.includes(channel)}
            onCheckedChange={(checked) =>
              setSelected((current) => (checked ? [...current, channel] : current.filter((item) => item !== channel)))
            }
          >
            {channel}
          </Checkbox>
        ))}
      </div>
    </fieldset>
  );
}
